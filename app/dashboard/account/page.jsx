import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AccountForm from './AccountForm'
import LogoutButton from '../LogoutButton'

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: jobCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('first_name, last_name, phone, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', user.id),
  ])

  let carrierProfile = null
  if (profile?.role === 'carrier') {
    const { data: cp } = await supabase
      .from('carrier_profiles')
      .select(
        'public_name, profile_description, service_categories, service_cities, payment_methods, application_status, city',
      )
      .eq('id', user.id)
      .single()
    carrierProfile = cp
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 pt-10">
      {/* Sub-nav */}
      <nav className="flex gap-6 border-b border-gray-200 mb-10">
        <Link
          href="/get-prices"
          className="pb-3 text-sm text-gray-500 hover:text-gray-900"
        >
          Get Prices
        </Link>
        <Link
          href="/dashboard"
          className="pb-3 text-sm text-gray-500 hover:text-gray-900"
        >
          My Deliveries ({jobCount ?? 0})
        </Link>
        <Link
          href="/dashboard/account"
          className="pb-3 text-sm font-bold text-gray-900 border-b-2 border-gray-900"
        >
          Account
        </Link>
        <LogoutButton />
      </nav>

      <AccountForm user={user} profile={profile} carrierProfile={carrierProfile} />
    </div>
  )
}
