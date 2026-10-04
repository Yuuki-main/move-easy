import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { privateFileUrl } from '@/lib/upload-rules'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const providerName = String(body.provider_name ?? '').trim().slice(0, 120)
    const coverage =
      body.coverage_amount === '' || body.coverage_amount == null
        ? null
        : Number(body.coverage_amount)
    const proofKey = body.proof_key || null

    if (!providerName) {
      return NextResponse.json({ error: 'Enter the insurance provider' }, { status: 400 })
    }
    if (coverage !== null && (!Number.isFinite(coverage) || coverage < 0 || coverage > 1e10)) {
      return NextResponse.json({ error: 'Enter a valid coverage amount' }, { status: 400 })
    }
    // The proof must be a file this carrier uploaded — never an arbitrary URL.
    if (proofKey && !proofKey.startsWith(`private/carrier-documents/${user.id}/`)) {
      return NextResponse.json({ error: 'Invalid proof file' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('carrier_insurance')
      .insert({
        carrier_id: user.id,
        provider_name: providerName,
        coverage_amount: coverage,
        proof_url: privateFileUrl(proofKey),
        proof_key: proofKey,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return serverError('carriers/settings/insurance', error)
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[insurance:POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
