import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError } from '@/lib/api-errors'

// POST /api/notifications/mark-read { notificationIds: [...] } | { all: true }
export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { notificationIds, all } = await req.json().catch(() => ({}))

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (!all) {
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: 'notificationIds required' }, { status: 400 })
    }
    query = query.in('id', notificationIds.slice(0, 100))
  }

  const { error } = await query
  if (error) return serverError('notifications/mark-read', error)
  return NextResponse.json({ ok: true })
}
