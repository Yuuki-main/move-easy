import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function AdminOverview() {
  const supabase = await createClient()

  const { count: totalJobs } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })

  const { count: totalCarriers } = await supabase
    .from('carrier_profiles')
    .select('*', { count: 'exact', head: true })

  const { count: pendingCarriers } = await supabase
    .from('carrier_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('application_status', 'pending')

  const { count: totalBookings } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })

  // Platform earnings = sum of all fee deductions
  const { data: fees } = await supabase
    .from('wallet_transactions')
    .select('amount')
    .eq('type', 'fee_deduction')

  const totalEarnings = fees?.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0

  const stats = [
    { label: 'Total Jobs', value: totalJobs ?? 0 },
    { label: 'Total Carriers', value: totalCarriers ?? 0 },
    {
      label: 'Pending Approvals',
      value: pendingCarriers ?? 0,
      highlight: (pendingCarriers ?? 0) > 0,
    },
    { label: 'Total Bookings', value: totalBookings ?? 0 },
    {
      label: 'Platform Earnings',
      value: `₹${totalEarnings.toFixed(2)}`,
      highlight: true,
      green: true,
    },
  ]

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Overview</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-5 ${
              s.green
                ? 'bg-green-50 border-green-200'
                : s.highlight && typeof s.value === 'number' && s.value > 0
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-white border-gray-200'
            }`}
          >
            <p
              className={`text-2xl font-bold ${s.green ? 'text-green-700' : 'text-gray-900'}`}
            >
              {s.value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/carriers"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <p className="text-2xl mb-2">🚚</p>
          <p className="font-semibold text-sm text-gray-800">Manage Carriers</p>
          <p className="text-xs text-gray-400 mt-1">
            Approve or reject applications
          </p>
        </Link>
        <Link
          href="/admin/jobs"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <p className="text-2xl mb-2">📦</p>
          <p className="font-semibold text-sm text-gray-800">All Jobs</p>
          <p className="text-xs text-gray-400 mt-1">Monitor job requests</p>
        </Link>
        <Link
          href="/admin/transactions"
          className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition-all"
        >
          <p className="text-2xl mb-2">💰</p>
          <p className="font-semibold text-sm text-gray-800">Transactions</p>
          <p className="text-xs text-gray-400 mt-1">View all wallet activity</p>
        </Link>
      </div>
    </div>
  )
}
