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
    .select('first_name, role')
    .eq('id', user.id)
    .single()

  // Fetch unread quote count: pending quotes on user's open jobs
  let unreadCount = 0

  const { data: userJobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('customer_id', user.id)

  if (userJobs && userJobs.length > 0) {
    const jobIds = userJobs.map((j) => j.id)
    const { count } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .in('job_id', jobIds)
      .eq('status', 'pending')

    unreadCount = count || 0
  }

  return (
    <NavbarClient
      user={user}
      firstName={profile?.first_name || null}
      role={profile?.role || null}
      unreadCount={unreadCount}
    />
  )
}
