import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { notificationIds } = await req.json()
  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return NextResponse.json({ error: 'notificationIds required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .in('id', notificationIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
