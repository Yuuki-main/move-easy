import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
    }

    const { amount } = await req.json()

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'nzd',
            product_data: {
              name: 'Moving Easy Wallet Top-up',
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/wallet?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/carrier/wallet?cancelled=true`,
      metadata: {
        carrier_id: user.id,
        amount: amount.toString(),
        type: 'wallet_topup',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('TOPUP ERROR:', err)

    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
