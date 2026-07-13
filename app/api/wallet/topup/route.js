import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { amount } = await req.json()
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount < 10 ||
    amount > 10000
  )
    return NextResponse.json({ error: 'Amount must be between $10 and $10,000' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'nzd',
          product_data: { name: 'Move Easy Wallet Top-up' },
          unit_amount: amount * 100, // cents
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
      type: 'wallet_topup', // added later
    },
  })

  return NextResponse.json({ url: session.url })
}
