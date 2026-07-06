import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  const body = await req.json()

  // Generate slug from displayName
  const slugBase = body.displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  const slug = `${slugBase}-${user.id.slice(-4)}`

  // 1. Create carrier profile
  const { data: carrier, error } = await supabase
    .from('carrier_profiles')
    .insert({
      id: user.id,

      public_name: body.displayName,
      profile_description: body.bio,

      payment_methods: body.paymentMethods,

      legal_company_name: body.companyName,
      company_registration_number: body.companyRegNumber,
      gst_number: body.gstNumber,

      service_categories: body.categories,

      slug,

      application_status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Save address
  const { error: addressError } = await supabase
    .from('carrier_addresses')
    .insert({
      carrier_id: carrier.id,

      street: body.street,
      city: body.city,
      region: body.region,
      postcode: body.postcode,
    })

  if (addressError) {
    return NextResponse.json({ error: addressError.message }, { status: 500 })
  }

  // 3. Update user role
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      role: 'carrier',
    })
    .eq('id', user.id)

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    carrierId: carrier.id,
    slug,
  })
}
