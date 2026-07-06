import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

const TOPUP_AMOUNTS = [500, 1000, 2000, 5000] // INR amounts

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { amount } = await req.json()
  if (!TOPUP_AMOUNTS.includes(amount))
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: { name: 'Move Easy Wallet Top-up' },
          unit_amount: amount * 100, // paise
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
