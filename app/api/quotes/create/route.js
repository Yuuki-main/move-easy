import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { trySendEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { newQuoteForCustomer } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { notify } from '@/lib/notifications'
import { loadChecklist } from '@/lib/carrier-profile'
import { MAX_QUOTE_MESSAGE, parsePrice } from '@/lib/quotes'
import { serverError } from '@/lib/api-errors'

const UUID_RE = /^[0-9a-f-]{36}$/i

export async function POST(req) {
  // Create Supabase SSR client
  const supabase = await createClient()

  // Get logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Get + validate request body
  const body = await req.json().catch(() => ({}))
  const jobId = body.jobId
  const price = parsePrice(body.price)
  const message = String(body.message ?? '').trim().slice(0, MAX_QUOTE_MESSAGE) || null

  if (!UUID_RE.test(jobId ?? '')) {
    return NextResponse.json({ error: 'Invalid job' }, { status: 400 })
  }
  if (price == null) {
    return NextResponse.json(
      { error: 'Enter a price between $1 and $999,999' },
      { status: 400 },
    )
  }

  // Verify carrier exists and get wallet balance + name
  const { data: carrier, error: carrierError } = await supabase
    .from('carrier_profiles')
    .select('id, application_status, wallet_balance, public_name')
    .eq('id', user.id)
    .single()

  if (carrierError || !carrier) {
    return NextResponse.json(
      { error: 'Carrier profile not found' },
      { status: 404 },
    )
  }

  // Carrier must be active
  if (carrier.application_status !== 'active') {
    return NextResponse.json({ error: 'Carrier not active' }, { status: 403 })
  }

  // A complete profile is required to quote (ID, insurance, photo, …)
  const checklist = await loadChecklist(user.id)
  if (!checklist.complete) {
    return NextResponse.json(
      {
        error: `Complete your profile before quoting: ${checklist.missing
          .map((i) => i.label.toLowerCase())
          .join('; ')}.`,
        incompleteProfile: true,
      },
      { status: 403 },
    )
  }

  // Minimum $1 wallet balance required to submit any quote
  const currentBalance = carrier.wallet_balance || 0
  if (currentBalance < 1) {
    return NextResponse.json(
      {
        error: `A minimum wallet balance of $1.00 is required to submit quotes. Please top up your wallet.`,
        insufficientBalance: true,
        shortfall: (1 - currentBalance).toFixed(2),
      },
      { status: 402 },
    )
  }

  // Job must still be open for quoting
  const { data: job, error: jobFetchError } = await supabase
    .from('jobs')
    .select('id, status, customer_id')
    .eq('id', jobId)
    .single()

  if (jobFetchError || !job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (!['open', 'quoted'].includes(job.status)) {
    return NextResponse.json(
      { error: 'This job is no longer accepting quotes' },
      { status: 409 },
    )
  }

  // Prevent duplicate quotes
  const { data: existing } = await supabase
    .from('quotes')
    .select('id, status')
    .eq('job_id', jobId)
    .eq('carrier_id', user.id)
    .maybeSingle()

  if (existing && existing.status !== 'withdrawn') {
    return NextResponse.json({ error: 'Already quoted' }, { status: 409 })
  }

  // Create quote — or revive the carrier's withdrawn one (one row per job+carrier)
  let quote, quoteError
  try {
    const result = existing
      ? await supabaseAdmin
          .from('quotes')
          .update({
            price,
            message,
            status: 'pending',
            previous_price: null,
            expires_at: null,
            created_at: new Date().toISOString(),
            updated_at: null,
          })
          .eq('id', existing.id)
          .eq('carrier_id', user.id)
          .select()
          .single()
      : await supabase
          .from('quotes')
          .insert({
            job_id: jobId,
            carrier_id: user.id,
            price,
            message,
            status: 'pending',
          })
          .select()
          .single()
    quote = result.data
    quoteError = result.error
  } catch (err) {
    console.error('[quotes/create] Insert failed:', err)
    return serverError('quotes/create', err)
  }

  if (quoteError) {
    if (quoteError.code === '23505') {
      return NextResponse.json({ error: 'Already quoted' }, { status: 409 })
    }
    return serverError('quotes/create', quoteError)
  }

  if (!quote) {
    return NextResponse.json({ error: 'Quote created but could not be retrieved' }, { status: 500 })
  }

  // Open a chat conversation between customer and carrier right away
  await supabaseAdmin
    .from('conversations')
    .upsert(
      { job_id: jobId, carrier_id: user.id, customer_id: job.customer_id },
      { onConflict: 'job_id,carrier_id', ignoreDuplicates: true },
    )

  // Update job status if still open
  await supabase
    .from('jobs')
    .update({
      status: 'quoted',
    })
    .eq('id', jobId)
    .eq('status', 'open')

  // Email the customer (non-blocking — the quote is already saved)
  const [{ data: jobDetails }, customer] = await Promise.all([
    supabaseAdmin
      .from('jobs')
      .select('id, type, pickup_address, delivery_address, move_date_from')
      .eq('id', jobId)
      .single(),
    getUserContact(job.customer_id),
  ])
  await notify(job.customer_id, {
    type: 'new_quote',
    title: `New quote: $${Number(price).toLocaleString('en-NZ')}`,
    content: `${carrier.public_name || 'A carrier'} quoted on your ${String(jobDetails?.type ?? 'move').replace(/_/g, ' ')}`,
    link: `/dashboard/jobs/${jobId}`,
    jobId,
  })

  if (customer && jobDetails) {
    await trySendEmail(
      {
        to: customer.email,
        ...newQuoteForCustomer({
          customerName: customer.firstName,
          carrierName: carrier.public_name || 'A carrier',
          price,
          message,
          job: jobDetails,
        }),
      },
      'quotes/create',
    )
  }

  return NextResponse.json({
    success: true,
    quoteId: quote.id,
  })
}
