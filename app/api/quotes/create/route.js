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

  // Verify carrier exists and get wallet balance
  const { data: carrier, error: carrierError } = await supabase
    .from('carrier_profiles')
    .select('id, application_status, wallet_balance')
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

  // Calculate platform fee (18%)
  const platformFee = Number(price) * 0.18

  // Prevent bidding if wallet balance is insufficient
  if ((carrier.wallet_balance || 0) < platformFee) {
    return NextResponse.json(
      {
        error: `Insufficient balance. You need $${platformFee.toFixed(
          2,
        )} to bid on this job. Please top up your wallet.`,
        insufficientBalance: true,
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
    .select('customer_id')
    .eq('id', jobId)
    .single()

  const {
    data: { user: customer },
  } = await supabaseAdmin.auth.admin.getUserById(job.customer_id)

  await sendEmail({
    to: customer.email,
    subject: 'You have a new quote on your move request',
    html: `
      <h2>New quote received!</h2>
      <p>A carrier has submitted a quote of <strong>$${price}</strong> for your move.</p>
      ${message ? `<p>Message: "${message}"</p>` : ''}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/jobs/${jobId}"
         style="background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">
        View Quote
      </a>
    `,
  })

  return NextResponse.json({
    success: true,
    quoteId: quote.id,
  })
}
