import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const {
    legal_company_name,
    company_registration_number,
    gst_number,
    is_gst_registered,
    is_individual_carrier,
  } = body

  const update = { is_gst_registered, is_individual_carrier }
  if (!is_individual_carrier) {
    update.legal_company_name = legal_company_name
    update.company_registration_number = company_registration_number
    update.gst_number = is_gst_registered ? gst_number : null
  }

  const { error } = await supabase
    .from('carrier_profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
