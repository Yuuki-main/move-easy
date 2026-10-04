import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const MIN_TOPUP = 1
const MAX_TOPUP = 10000

export async function POST(req) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { data: carrier } = await supabase
      .from('carrier_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!carrier) {
      return NextResponse.json({ error: 'Only carriers have a wallet' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const amount = Number(body.amount)
    const cents = Math.round(amount * 100)

    if (
      !Number.isFinite(amount) ||
      Math.abs(amount * 100 - cents) > 1e-6 || // max 2 decimal places
      amount < MIN_TOPUP ||
      amount > MAX_TOPUP
    ) {
      return NextResponse.json(
        { error: `Enter an amount between $${MIN_TOPUP} and $${MAX_TOPUP.toLocaleString('en-NZ')}` },
        { status: 400 },
      )
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'nzd',
            product_data: {
              name: 'Moving Easy Wallet Top-up',
            },
            unit_amount: cents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/wallet?cancelled=true`,
      metadata: {
        carrier_id: user.id,
        amount: (cents / 100).toFixed(2),
        type: 'wallet_topup',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('TOPUP ERROR:', err)
    return NextResponse.json(
      { error: 'Could not start the payment. Please try again.' },
      { status: 500 },
    )
  }
}
