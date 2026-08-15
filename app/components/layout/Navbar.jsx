import { createClient } from '@/lib/supabase/server'
import NavbarClient from './NavbarClient'

export default async function Navbar() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return <NavbarClient user={null} firstName={null} role={null} unreadCount={0} />
  }

  const user = session.user

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, role, is_admin')
    .eq('id', user.id)
    .single()

  let unreadCount = 0
  let notifications = []

  // Chat message notifications (both carriers and customers)
  try {
    const { data: chatNotifs } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    notifications = (chatNotifs || []).map((n) => ({
      id: n.id,
      kind: 'chat',
      jobId: n.job_id,
      conversationId: n.conversation_id,
      content: n.content,
    }))
  } catch (err) {
    // The notifications table may not exist yet (migration pending) — don't break the navbar.
    console.error('[Navbar] Failed to load chat notifications:', err)
  }

  if (profile?.role === 'carrier') {
    // Unseen confirmed bookings (quote just got accepted)
    const { data: unseenBookings } = await supabase
      .from('bookings')
      .select(
        `
        id, job_id,
        jobs ( type, pickup_address, delivery_address ),
        quotes ( price )
      `,
      )
      .eq('carrier_id', user.id)
      .eq('viewed_by_carrier', false)
      .order('created_at', { ascending: false })
      .limit(10)

    const bookingNotifications = (unseenBookings || []).map((b) => ({
      id: b.id,
      kind: 'booking',
      jobId: b.job_id,
      type: b.jobs?.type,
      pickup: b.jobs?.pickup_address,
      delivery: b.jobs?.delivery_address,
      price: b.quotes?.price,
    }))

    notifications = [...notifications, ...bookingNotifications]
    unreadCount = notifications.length
  } else {
    // Pending quotes on the customer's own jobs
    const { data: userJobs } = await supabase
      .from('jobs')
      .select('id')
      .eq('customer_id', user.id)

    let pendingQuotes = 0
    if (userJobs && userJobs.length > 0) {
      const jobIds = userJobs.map((j) => j.id)
      const { count } = await supabase
        .from('quotes')
        .select('id', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'pending')

      pendingQuotes = count || 0
    }

    unreadCount = notifications.length + pendingQuotes
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
