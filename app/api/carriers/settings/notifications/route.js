import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { job_categories, email_frequency, updates_opt_in, operational_area } = body

  const { error } = await supabase
    .from('carrier_notification_preferences')
    .upsert({
      carrier_id: user.id,
      job_categories,
      email_frequency,
      updates_opt_in,
      operational_area,
      updated_at: new Date().toISOString(),
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
