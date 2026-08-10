import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service-role'

export async function POST(req) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { carrierId, status } = await req.json()

    if (!['active', 'rejected', 'pending'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    const supabase = createServiceClient()

    const { error } = await supabase
      .from('carrier_profiles')
      .update({ application_status: status })
      .eq('id', carrierId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 },
    )
  }
}
