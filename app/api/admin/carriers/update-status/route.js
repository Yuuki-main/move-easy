import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  // Verify admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { carrierId, status } = await req.json()

  if (!['active', 'rejected', 'pending'].includes(status))
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const { error } = await supabase
    .from('carrier_profiles')
    .update({ application_status: status })
    .eq('id', carrierId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
