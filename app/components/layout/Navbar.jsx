import { createClient } from '@/lib/supabase/server'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return (
      <NavbarClient
        user={null}
        firstName={null}
        role={null}
        unreadCount={0}
        notifications={[]}
      />
    )
  }

  const user = session.user

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, role, is_admin')
    .eq('id', user.id)
    .single()

  // One source of truth for the bell: public.notifications (chat messages via
  // DB trigger; quotes, bookings, reviews via app/lib/notifications.js).
  let unreadCount = 0
  let notifications = []
  try {
    const [{ data: rows, error }, { count }] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, type, title, content, link, job_id, created_at')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false),
    ])
    if (error) throw error
    notifications = (rows ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title || (n.type === 'chat_message' ? 'New message' : 'Notification'),
      content: n.content,
      link: n.link,
      jobId: n.job_id,
      createdAt: n.created_at,
    }))
    unreadCount = count ?? notifications.length
  } catch (err) {
    // Table/columns missing until migrations 004 + 009 are applied — keep the navbar working.
    console.error('[Navbar] Failed to load notifications:', err.message)
  }

  return (
    <NavbarClient
      user={user}
      firstName={profile?.first_name || null}
      role={profile?.role || null}
      unreadCount={unreadCount}
      notifications={notifications}
      isAdmin={profile?.is_admin || false}
    />
  )
}
