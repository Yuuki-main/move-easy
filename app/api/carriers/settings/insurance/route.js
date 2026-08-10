import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await req.json()
    const { provider_name, coverage_amount, proof_url, proof_key } = body

    const { data, error } = await supabase
      .from('carrier_insurance')
      .insert({
        carrier_id: user.id,
        provider_name,
        coverage_amount,
        proof_url,
        proof_key,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[insurance:POST]', err)
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 },
    )
  }
}
