import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// POST /api/chat/read { conversationId } — the viewer has seen this chat:
// mark the other person's messages read and clear their chat notifications.
export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { conversationId } = await req.json().catch(() => ({}))

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, customer_id, carrier_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (!conv || ![conv.customer_id, conv.carrier_id].includes(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  const [{ error: msgError }, { error: notifError }] = await Promise.all([
    supabaseAdmin
      .from('chat_messages')
      .update({ read_at: now })
      .eq('conversation_id', conv.id)
      .neq('sender_id', user.id)
      .is('read_at', null),
    supabaseAdmin
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('conversation_id', conv.id)
      .eq('is_read', false),
  ])

  if (msgError || notifError) {
    console.error('[chat/read]', (msgError || notifError).message)
  }
  return NextResponse.json({ ok: true })
}
