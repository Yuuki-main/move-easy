import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { trySendEmail } from '@/lib/email'
import { walletTopupReceipt } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'

export async function POST(req) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
  } catch {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  ) {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object
  if (session.metadata?.type !== 'wallet_topup') {
    return NextResponse.json({ received: true })
  }

  // Async methods fire `completed` before the money lands; they come back
  // with `async_payment_succeeded` once paid.
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ received: true })
  }

  const carrierId = session.metadata.carrier_id
  // Credit what was actually charged, never what the metadata claims.
  const amount = Math.round(Number(session.amount_total)) / 100
  const paymentRef = session.payment_intent || session.id

  if (!carrierId || !(amount > 0) || session.currency !== 'nzd') {
    console.error('[stripe] Unexpected top-up session', session.id)
    return NextResponse.json({ received: true })
  }

  // Idempotent + atomic: a retried event returns credited=false.
  const { data: credited, error } = await supabaseAdmin.rpc('credit_wallet_topup', {
    p_carrier_id: carrierId,
    p_amount: amount,
    p_payment_intent: paymentRef,
  })

  if (error) {
    console.error('[stripe] Wallet credit failed:', error.message)
    // Non-2xx makes Stripe retry later; the RPC is safe to repeat.
    return NextResponse.json({ error: 'Credit failed' }, { status: 500 })
  }

  if (credited) {
    const [contact, { data: profile }] = await Promise.all([
      getUserContact(carrierId),
      supabaseAdmin
        .from('carrier_profiles')
        .select('public_name, wallet_balance')
        .eq('id', carrierId)
        .single(),
    ])
    if (contact) {
      await trySendEmail(
        {
          to: contact.email,
          ...walletTopupReceipt({
            name: profile?.public_name || contact.firstName,
            amount,
            balance: profile?.wallet_balance,
            paymentRef,
          }),
        },
        'stripe',
      )
    }
  }

  return NextResponse.json({ received: true })
}
