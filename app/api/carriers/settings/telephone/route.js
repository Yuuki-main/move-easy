import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { country_code, number, type } = body

  const { data, error } = await supabase
    .from('carrier_telephones')
    .insert({ carrier_id: user.id, country_code, number, type })
    .select()
    .single()

  if (error) return serverError('carriers/settings/telephone', error)
  return NextResponse.json({ data })
}
