import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  PAYMENT_METHODS,
  PAYMENT_TIMEFRAMES,
  COLLECTION_DATE_TYPES,
  MAX_QUOTE_MESSAGE,
  isQuoteExpired,
  parsePrice,
} from '@/lib/quotes'
import { serverError } from '@/lib/api-errors'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const bad = (error, status = 400) => NextResponse.json({ error }, { status })

function pickFrom(list, allowed) {
  if (!Array.isArray(list)) return null
  const picked = allowed.filter((v) => list.includes(v))
  return picked.length ? picked : null
}

// Lowest live bid on the job from any OTHER carrier.
async function lowestCompetitorPrice(jobId, quoteId) {
  const { data } = await supabaseAdmin
    .from('quotes')
    .select('price, expires_at')
    .eq('job_id', jobId)
    .eq('status', 'pending')
    .neq('id', quoteId)
  const live = (data ?? []).filter((q) => !isQuoteExpired(q))
  return live.length ? Math.min(...live.map((q) => Number(q.price))) : null
}

// PATCH /api/quotes/:id — the carrier amends (or withdraws) their own quote.
// Body: { action, ...fields }
export async function PATCH(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return bad('Unauthenticated', 401)

  const body = await req.json().catch(() => ({}))
  const { action } = body

  const { data: quote } = await supabaseAdmin
    .from('quotes')
    .select('*, jobs(id, status)')
    .eq('id', id)
    .maybeSingle()

  if (!quote || quote.carrier_id !== user.id) return bad('Quote not found', 404)

  const now = new Date().toISOString()

  // Private notes can be edited whatever state the quote is in.
  if (action === 'notes') {
    const notes = String(body.notes ?? '').trim().slice(0, 1000)
    const { error } = await supabaseAdmin
      .from('quotes')
      .update({ carrier_notes: notes || null })
      .eq('id', id)
    if (error) return serverError('quotes/[id]', error)
    return NextResponse.json({ success: true })
  }

  if (quote.status !== 'pending') {
    return bad(
      quote.status === 'withdrawn'
        ? 'This quote has been withdrawn'
        : 'This quote can no longer be changed',
      409,
    )
  }
  if (!['open', 'quoted'].includes(quote.jobs?.status)) {
    return bad('This job is no longer accepting quotes', 409)
  }

  let update

  switch (action) {
    case 'price':
    case 'match_lowest': {
      let price
      if (action === 'match_lowest') {
        price = await lowestCompetitorPrice(quote.job_id, id)
        if (price == null) return bad('There are no other quotes to match', 409)
      } else {
        price = parsePrice(body.price)
        if (price == null) return bad('Enter a valid price')
      }
      if (price === Number(quote.price)) {
        return NextResponse.json({ success: true, price })
      }
      update = { price, previous_price: quote.price }
      break
    }

    case 'collection_date': {
      const { type, days, from, to } = body
      if (!COLLECTION_DATE_TYPES.some((t) => t.value === type)) {
        return bad('Choose a collection date option')
      }
      update = {
        collection_date_type: type,
        collection_within_days: null,
        collection_date_from: null,
        collection_date_to: null,
      }
      if (type === 'within_days') {
        const n = Number(days)
        if (!Number.isInteger(n) || n < 1 || n > 365) {
          return bad('Enter a number of days between 1 and 365')
        }
        update.collection_within_days = n
      }
      if (['on', 'from', 'between'].includes(type)) {
        if (!DATE_RE.test(from ?? '')) return bad('Choose a date')
        update.collection_date_from = from
      }
      if (['before', 'between'].includes(type)) {
        if (!DATE_RE.test(to ?? '')) return bad('Choose a date')
        update.collection_date_to = to
      }
      if (type === 'between' && to < from) {
        return bad('The end date must be after the start date')
      }
      break
    }

    case 'payment_timeframes': {
      const picked = pickFrom(body.values, PAYMENT_TIMEFRAMES)
      if (!picked) return bad('Select at least one payment option')
      update = { payment_timeframes: picked }
      break
    }

    case 'payment_methods': {
      const picked = pickFrom(body.values, PAYMENT_METHODS)
      if (!picked) return bad('Select at least one payment method')
      update = { payment_methods: picked }
      break
    }

    case 'message': {
      update = { message: String(body.message ?? '').trim().slice(0, MAX_QUOTE_MESSAGE) || null }
      break
    }

    case 'expiry': {
      if (body.expiresAt == null) {
        update = { expires_at: null }
        break
      }
      const at = new Date(body.expiresAt)
      if (Number.isNaN(at.getTime())) return bad('Choose a valid date and time')
      if (at.getTime() <= Date.now()) return bad('The expiry must be in the future')
      update = { expires_at: at.toISOString() }
      break
    }

    case 'other': {
      update = { electric_vehicle: Boolean(body.electricVehicle) }
      break
    }

    case 'withdraw': {
      const { error } = await supabaseAdmin
        .from('quotes')
        .update({ status: 'withdrawn', updated_at: now })
        .eq('id', id)
        .eq('status', 'pending')
      if (error) return serverError('quotes/[id]', error)

      // Re-open the job if that was the last live quote on it.
      const { count } = await supabaseAdmin
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .eq('job_id', quote.job_id)
        .eq('status', 'pending')
      if (!count) {
        await supabaseAdmin
          .from('jobs')
          .update({ status: 'open' })
          .eq('id', quote.job_id)
          .eq('status', 'quoted')
      }
      return NextResponse.json({ success: true })
    }

    default:
      return bad('Unknown action')
  }

  const { data: saved, error } = await supabaseAdmin
    .from('quotes')
    .update({ ...update, updated_at: now })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .maybeSingle()

  if (error) return serverError('quotes/[id]', error)
  if (!saved) return bad('This quote can no longer be changed', 409)

  return NextResponse.json({ success: true, quote: saved })
}
