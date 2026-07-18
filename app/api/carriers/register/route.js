import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { carrierApiSchema } from '@/lib/validations/auth'

export async function POST(req) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 },
    )
  }

  // Server-side Zod validation
  const parsed = carrierApiSchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return NextResponse.json(
      { error: 'Validation failed', fields: fieldErrors },
      { status: 400 },
    )
  }

  const data = parsed.data

  // Generate slug from displayName
  const slugBase = data.displayName
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

      public_name: data.displayName,
      profile_description: data.bio,

      payment_methods: data.paymentMethods,

      legal_company_name: data.companyName,
      company_registration_number: data.companyRegNumber,
      gst_number: data.gstNumber,

      service_categories: data.categories,

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

      street: data.street,
      city: data.city,
      region: data.region,
      postcode: data.postcode,
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
