import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { public_name, profile_description, payment_methods, service_categories, service_cities } =
    body

  const { error } = await supabase
    .from('carrier_profiles')
    .update({ public_name, profile_description, payment_methods, service_categories, service_cities })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
