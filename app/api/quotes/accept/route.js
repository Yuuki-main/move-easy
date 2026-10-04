import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { trySendEmail } from '@/lib/email'
import {
  bookingConfirmedForCustomer,
  quoteAcceptedForCarrier,
} from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { PLATFORM_FEE_RATE } from '@/lib/quotes'
import { notify } from '@/lib/notifications'

const UUID_RE = /^[0-9a-f-]{36}$/i

// Errors raised by the accept_quote() SQL function → HTTP responses
const RPC_ERRORS = {
  JOB_NOT_FOUND: [403, 'Not authorized'],
  JOB_NOT_AVAILABLE: [409, 'This job is already booked or no longer open'],
  QUOTE_NOT_FOUND: [404, 'Quote not found'],
  QUOTE_NOT_AVAILABLE: [409, 'This quote is no longer available'],
  QUOTE_EXPIRED: [409, 'This quote has expired'],
}

export async function POST(req) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { quoteId, jobId } = await req.json().catch(() => ({}))
  if (!UUID_RE.test(quoteId ?? '') || !UUID_RE.test(jobId ?? '')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // One transaction: lock job → check quote → accept / reject others → book →
  // charge the fee. Concurrent clicks queue on the job lock; the second one
  // sees the job already booked and fails cleanly.
  const { data: rows, error: rpcError } = await supabaseAdmin.rpc('accept_quote', {
    p_quote_id: quoteId,
    p_job_id: jobId,
    p_customer_id: user.id,
    p_fee_rate: PLATFORM_FEE_RATE,
  })

  if (rpcError) {
    const known = Object.keys(RPC_ERRORS).find((k) => rpcError.message?.includes(k))
    if (known) {
      const [status, error] = RPC_ERRORS[known]
      return NextResponse.json({ error }, { status })
    }
    // Unique-index hit: someone else's accept won the race
    if (rpcError.code === '23505') {
      return NextResponse.json({ error: 'This job is already booked' }, { status: 409 })
    }
    console.error('[quotes/accept] accept_quote failed:', rpcError)
    return NextResponse.json({ error: 'Could not accept the quote' }, { status: 500 })
  }

  const { booking_id: bookingId, carrier_id: carrierId, price, fee } = rows[0]

  // Attach the booking to the (already-existing, pre-quote) conversation
  let chatCreated = true
  try {
    const { error: convError } = await supabaseAdmin
      .from('conversations')
      .upsert(
        {
          job_id: jobId,
          booking_id: bookingId,
          customer_id: user.id,
          carrier_id: carrierId,
        },
        { onConflict: 'job_id,carrier_id' },
      )

    if (convError) {
      chatCreated = false
      console.error('[quotes/accept] Conversation upsert failed:', convError)
    }
  } catch (convErr) {
    chatCreated = false
    console.error('[quotes/accept] Conversation upsert threw:', convErr)
  }

  // Emails — the booking is already committed, so failures are only logged.
  const [{ data: job }, { data: carrierProfile }, carrierContact] = await Promise.all([
    supabaseAdmin
      .from('jobs')
      .select('id, type, pickup_address, delivery_address, move_date_from')
      .eq('id', jobId)
      .single(),
    supabaseAdmin
      .from('carrier_profiles')
      .select('public_name')
      .eq('id', carrierId)
      .single(),
    getUserContact(carrierId),
  ])

  const customerName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'Customer'
  const carrierName = carrierProfile?.public_name || carrierContact?.firstName || 'Your carrier'

  await Promise.all([
    notify(carrierId, {
      type: 'quote_accepted',
      title: 'Quote accepted 🎉',
      content: `${customerName} accepted your $${Number(price).toLocaleString('en-NZ')} quote`,
      link: `/dashboard/carrier/jobs/${jobId}`,
      jobId,
    }),
    carrierContact &&
      trySendEmail(
        {
          to: carrierContact.email,
          ...quoteAcceptedForCarrier({ carrierName, customerName, price, fee, job }),
        },
        'quotes/accept',
      ),
    user.email &&
      trySendEmail(
        {
          to: user.email,
          ...bookingConfirmedForCustomer({ customerName, carrierName, price, job }),
        },
        'quotes/accept',
      ),
  ])

  return NextResponse.json({
    bookingId,
    chatCreated,
  })
}
