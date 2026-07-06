import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    if (session.metadata?.type !== 'wallet_topup') {
      return NextResponse.json({ received: true })
    }

    const carrierId = session.metadata.carrier_id
    const amount = Number(session.metadata.amount)

    // Credit wallet
    // await supabaseAdmin
    //   .from('carrier_profiles')
    //   .update({
    //     wallet_balance: supabaseAdmin.rpc('increment_balance', {
    //       carrier_id: carrierId,
    //       amount,
    //     }),
    //   })
    //   .eq('id', carrierId)

    await supabaseAdmin.rpc('increment_balance', {
      carrier_id: carrierId,
      amount,
    })

    // Log transaction
    await supabaseAdmin.from('wallet_transactions').insert({
      carrier_id: carrierId,
      type: 'topup',
      amount,
      description: `Wallet top-up via Stripe`,
      stripe_payment_intent_id: session.payment_intent,
    })
  }

  return NextResponse.json({ received: true })
  if (txError?.code === '23505') {
    return NextResponse.json({ received: true })
  }
}

// export const config = { api: { bodyParser: false } }
