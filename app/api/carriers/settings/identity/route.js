import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { identitySchema } from '@/dashboard/carrier/settings/schemas'

export async function PATCH(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()

  // Validate with Zod
  const parsed = identitySchema.safeParse(body)
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors
    return NextResponse.json(
      { error: 'Validation failed', fields: fieldErrors },
      { status: 400 },
    )
  }

  const { email, timezone, new_password, last_name, date_of_birth } = parsed.data

  // Update email if changed
  if (email && email !== user.email) {
    const { error: emailErr } = await supabase.auth.updateUser({ email })
    if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })
  }

  // Update password if provided
  if (new_password && new_password.length >= 8) {
    const { error: pwErr } = await supabase.auth.updateUser({ password: new_password })
    if (pwErr) return NextResponse.json({ error: pwErr.message }, { status: 500 })
  }

  // Update timezone on carrier_profiles
  const { error } = await supabase
    .from('carrier_profiles')
    .update({ timezone })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update last_name and date_of_birth on profiles table
  if (last_name !== undefined || date_of_birth !== undefined) {
    const profileUpdate = {}
    if (last_name !== undefined) profileUpdate.last_name = last_name
    if (date_of_birth !== undefined) profileUpdate.date_of_birth = date_of_birth

    const { error: profileErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
