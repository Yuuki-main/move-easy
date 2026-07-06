import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import QuickActions from './QuickActions'

export default async function CarrierDashboardPage() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Guard: customers shouldn't be here
  //   if (profile?.role === 'customer') redirect('/dashboard/customer')
  if (profile?.role === 'customer') redirect('/dashboard')

  //   const carrier = profile?.carrier_profiles

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 pb-10 pt-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="bg-gray-900 text-white rounded-xl px-4 py-2 text-sm">
            💰 ₹{carrier?.wallet_balance?.toFixed(2) ?? '0.00'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {carrier?.public_name || profile?.first_name} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">Carrier dashboard</p>
            <Link href={`/carrier/${user.id}`} className="text-sm text-blue-600 hover:underline mt-1 block">
              View my public profile →
            </Link>
          </div>

          {/* Application status badge */}
          {carrier?.application_status && (
            <span
              className={`text-xs font-semibold px-3 py-1.5 rounded-full
              ${carrier.application_status === 'active' ? 'bg-green-100 text-green-700' : ''}
              ${carrier.application_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
              ${carrier.application_status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
            `}
            >
              {carrier.application_status === 'active' && '✓ Approved'}
              {carrier.application_status === 'pending' &&
                '⏳ Application pending'}
              {carrier.application_status === 'rejected' && '✗ Rejected'}
            </span>
          )}
        </div>

        {/* Quick actions */}
        <QuickActions />

        {/* Profile summary */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">Your profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-400 text-xs">Name</p>
              <p className="text-gray-700 font-medium">
                {profile?.first_name} {profile?.last_name}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">City</p>
              <p className="text-gray-700 font-medium">
                {carrier?.city || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Services</p>
              <p className="text-gray-700 font-medium">
                {carrier?.service_categories?.join(', ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Payment methods</p>
              <p className="text-gray-700 font-medium">
                {carrier?.payment_methods?.join(', ') || '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
