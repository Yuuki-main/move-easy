import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase/admin'

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

  // Get request body
  const { jobId, price, message } = await req.json()

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

  // Prevent duplicate quotes
  const { data: existing } = await supabase
    .from('quotes')
    .select('id')
    .eq('job_id', jobId)
    .eq('carrier_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already quoted' }, { status: 409 })
  }

  // Create quote
  const { data: quote, error: quoteError } = await supabase
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

  if (quoteError) {
    return NextResponse.json({ error: quoteError.message }, { status: 500 })
  }

  // Update job status if still open
  await supabase
    .from('jobs')
    .update({
      status: 'quoted',
    })
    .eq('id', jobId)
    .eq('status', 'open')

  // Send email notification to customer
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('customer_id, pickup_address, delivery_address, move_date, type')
    .eq('id', jobId)
    .single()

  const {
    data: { user: customer },
  } = await supabaseAdmin.auth.admin.getUserById(job.customer_id)

  const customerName =
    customer.user_metadata?.first_name || customer.email?.split('@')[0] || 'Customer'
  const carrierName = carrier.public_name || customerName
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
    to: customer.email,
    subject: "You've received a new quote for your move",
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
        <h2 style="color:#111827;font-size:22px;margin:0 0 8px">New quote received!</h2>
        <p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.5">
          Hi ${customerName},<br/>
          <strong>${carrierName}</strong> has submitted a quote for your ${jobType}.
        </p>

        <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr>
              <td style="padding:6px 0;color:#6b7280">Carrier</td>
              <td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${carrierName}</td>
            </tr>
            <tr>
              <td style="padding:6px 0;color:#6b7280">Quoted price</td>
              <td style="padding:6px 0;text-align:right;font-weight:700;font-size:18px;color:#059669">$${Number(price).toFixed(2)}</td>
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

        ${message ? `
        <div style="background:#eff6ff;border-left:3px solid #3b82f6;border-radius:4px;padding:12px 16px;margin-bottom:24px;font-size:14px;color:#1e40af;font-style:italic">
          "${message}"
        </div>` : ''}

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/jobs/${jobId}"
           style="background:#2563eb;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;margin-bottom:24px">
          View Quote →
        </a>

        <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.5">
          You received this email because a carrier submitted a quote on your move request through Moving Easy.
        </p>
      </div>
    `,
  })

  return NextResponse.json({
    success: true,
    quoteId: quote.id,
  })
}
