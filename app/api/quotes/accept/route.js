import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'

export async function POST(req) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const { quoteId, jobId } = await req.json()

  // Verify job belongs to this customer
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, status')
    .eq('id', jobId)
    .single()

  if (!job || job.customer_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  if (job.status === 'booked') {
    return NextResponse.json({ error: 'Job already booked' }, { status: 409 })
  }

  // Get the accepted quote
  const { data: acceptedQuote } = await supabase
    .from('quotes')
    .select('*')
    .eq('id', quoteId)
    .single()

  if (!acceptedQuote) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
  }

  // 1. Mark this quote as accepted
  await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId)

  // 2. Reject all other quotes for this job
  await supabase
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('job_id', jobId)
    .neq('id', quoteId)

  // 3. Update job status to booked
  await supabase.from('jobs').update({ status: 'booked' }).eq('id', jobId)

  // 4. Create booking record
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      job_id: jobId,
      quote_id: quoteId,
      customer_id: user.id,
      carrier_id: acceptedQuote.carrier_id,
      status: 'confirmed',
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // 5. Deduct 18% platform fee from carrier wallet
  const platformFee = Number((acceptedQuote.price * 0.18).toFixed(2))

  // Use RPC to safely decrement balance
  await supabaseAdmin.rpc('decrement_balance', {
    carrier_id: acceptedQuote.carrier_id,
    amount: platformFee,
  })

  // Log the fee deduction
  await supabaseAdmin.from('wallet_transactions').insert({
    carrier_id: acceptedQuote.carrier_id,
    type: 'fee_deduction',
    amount: platformFee,
    description: `18% platform fee for job #${jobId}`,
    job_id: jobId,
    quote_id: quoteId,
  })

  // 6. Send email notification to carrier
  const {
    data: { user: carrier },
  } = await supabaseAdmin.auth.admin.getUserById(acceptedQuote.carrier_id)

  await sendEmail({
    to: carrier.email,
    subject: '🎉 Your quote was accepted!',
    html: `
      <h2>Quote accepted!</h2>
      <p>A customer has accepted your quote of <strong>₹${acceptedQuote.price}</strong>.</p>
      <p>A platform fee of <strong>₹${platformFee}</strong> (18%) has been deducted from your wallet.</p>
      <p>Log in to view the job and start messaging the customer.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/jobs/${jobId}"
         style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
        View Booking
      </a>
    `,
  })

  return NextResponse.json({
    bookingId: booking.id,
  })
}
