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

  // Verify job belongs to this customer — also fetch job details for email
  const { data: job } = await supabase
    .from('jobs')
    .select('id, customer_id, status, pickup_address, delivery_address, move_date, type')
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

  const {
    data: { user: customer },
  } = await supabaseAdmin.auth.admin.getUserById(job.customer_id)

  const { data: carrierProfile } = await supabaseAdmin
    .from('carrier_profiles')
    .select('public_name')
    .eq('id', acceptedQuote.carrier_id)
    .single()

  const carrierName = carrierProfile?.public_name || carrier?.email?.split('@')[0] || 'Carrier'
  const customerName =
    customer?.user_metadata?.first_name || customer?.email?.split('@')[0] || 'Customer'
  const jobType = job.type?.replace(/_/g, ' ') || 'move'
  const moveDate = job.move_date
    ? new Date(job.move_date).toLocaleDateString('en-NZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  await sendEmail({
    to: carrier.email,
    subject: '🎉 Your quote was accepted!',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#111827;font-size:22px;margin:0 0 8px">🎉 Quote accepted!</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.5">
          Hi ${carrierName},<br/>
          Great news — <strong>${customerName}</strong> has accepted your quote for their ${jobType}!
        </p>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:6px 0;color:#6b7280">Customer</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${customerName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280">Accepted quote</td>
              <td style="padding:6px 0;text-align:right;font-weight:700;font-size:18px;color:#059669">$${Number(acceptedQuote.price).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280">Platform fee (18%)</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#dc2626">-$${platformFee.toFixed(2)}</td>
            </tr>
            ${job.pickup_address ? `
            <tr>
              <td style="padding:6px 0;color:#6b7280">Pickup</td>
              <td style="padding:6px 0;text-align:right;color:#374151">${job.pickup_address}</td>
            </tr>` : ''}
            ${job.delivery_address ? `
            <tr>
              <td style="padding:6px 0;color:#6b7280">Delivery</td>
              <td style="padding:6px 0;text-align:right;color:#374151">${job.delivery_address}</td>
            </tr>` : ''}
            ${moveDate ? `
            <tr>
              <td style="padding:6px 0;color:#6b7280">Move date</td>
              <td style="padding:6px 0;text-align:right;color:#374151">${moveDate}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:6px 0;color:#6b7280">Job reference</td>
              <td style="padding:6px 0;text-align:right;font-family:monospace;color:#6b7280;font-size:12px">#${jobId.slice(0, 8)}</td>
            </tr>
          </table>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/jobs/${jobId}"
           style="background:#2563eb;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;margin-bottom:24px">
          View Booking →
        </a>

        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.5">
          You can now message the customer and coordinate the move. Log in to get started.
        </p>
      </div>
    `,
  })

  return NextResponse.json({
    bookingId: booking.id,
  })
}
