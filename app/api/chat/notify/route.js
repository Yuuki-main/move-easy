import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { trySendEmail } from '@/lib/email'
import { newChatMessage } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'

// Only email when the conversation had been quiet this long — one email per
// burst of messages, not one per message.
const QUIET_MS = 15 * 60 * 1000

// POST /api/chat/notify { conversationId } — called by ChatPanel after a send
export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { conversationId } = await req.json().catch(() => ({}))

  const { data: conv } = await supabaseAdmin
    .from('conversations')
    .select('id, job_id, customer_id, carrier_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (!conv || ![conv.customer_id, conv.carrier_id].includes(user.id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // The two newest messages: [the one just sent, the one before it]
  const { data: recent } = await supabaseAdmin
    .from('chat_messages')
    .select('sender_id, content, created_at')
    .eq('conversation_id', conv.id)
    .order('created_at', { ascending: false })
    .limit(2)

  const [latest, previous] = recent ?? []
  if (!latest || latest.sender_id !== user.id) {
    return NextResponse.json({ sent: false })
  }
  if (previous && new Date(latest.created_at) - new Date(previous.created_at) < QUIET_MS) {
    return NextResponse.json({ sent: false })
  }

  const senderIsCarrier = user.id === conv.carrier_id
  const recipientId = senderIsCarrier ? conv.customer_id : conv.carrier_id

  const [recipient, { data: carrier }] = await Promise.all([
    getUserContact(recipientId),
    supabaseAdmin
      .from('carrier_profiles')
      .select('public_name')
      .eq('id', conv.carrier_id)
      .single(),
  ])
  if (!recipient) return NextResponse.json({ sent: false })

  const senderName = senderIsCarrier
    ? carrier?.public_name || 'Your carrier'
    : user.user_metadata?.first_name || 'Your customer'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const link = senderIsCarrier
    ? `${appUrl}/dashboard/jobs/${conv.job_id}`
    : `${appUrl}/dashboard/carrier/jobs/${conv.job_id}`

  await trySendEmail(
    {
      to: recipient.email,
      ...newChatMessage({
        recipientName: senderIsCarrier ? recipient.firstName : carrier?.public_name,
        senderName,
        preview: latest.content ?? '',
        link,
      }),
    },
    'chat/notify',
  )

  return NextResponse.json({ sent: true })
}
