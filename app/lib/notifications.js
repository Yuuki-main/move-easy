import { supabaseAdmin } from '@/lib/supabase/admin'

// In-app notification (the bell / avatar menu). Never throws: a failed
// notification must not fail the action that caused it.
//   type:  'new_quote' | 'quote_accepted' | 'booking_completed' |
//          'booking_cancelled' | 'job_cancelled' | 'chat_message' (DB trigger)
export async function notify(userId, { type, title, content = null, link = null, jobId = null }) {
  if (!userId) return
  const { error } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    content: content ? String(content).slice(0, 200) : null,
    link,
    job_id: jobId,
  })
  if (error) console.error('[notify] insert failed:', error.message)
}

export async function notifyMany(userIds, payload) {
  await Promise.all([...new Set(userIds.filter(Boolean))].map((id) => notify(id, payload)))
}
