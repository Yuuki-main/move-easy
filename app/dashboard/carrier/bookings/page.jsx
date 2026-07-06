import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES = {
  confirmed: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

export default async function CarrierBookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      *,
      jobs (
        id, type, pickup_address, delivery_address,
        move_date, description
      ),
      quotes (price, message)
    `,
    )
    .eq('carrier_id', user.id)
    .order('created_at', { ascending: false })

  const confirmed = bookings?.filter((b) => b.status === 'confirmed') ?? []
  const completed = bookings?.filter((b) => b.status === 'completed') ?? []
  const cancelled = bookings?.filter((b) => b.status === 'cancelled') ?? []

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">My Bookings</h1>
      <p className="text-sm text-gray-400 mb-8">Jobs you have been hired for.</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Confirmed', count: confirmed.length, style: 'bg-yellow-50 text-yellow-700' },
          { label: 'Completed', count: completed.length, style: 'bg-green-50 text-green-700' },
          { label: 'Cancelled', count: cancelled.length, style: 'bg-gray-50 text-gray-500' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.style}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Bookings list */}
      {!bookings?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm mb-4">
            No bookings yet. Start bidding on jobs to get hired.
          </p>
          <Link
            href="/dashboard/carrier/jobs"
            className="inline-block bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Browse available jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const price = Number(booking.quotes?.price ?? 0)
            const platformFee = price * 0.18
            const earnings = price * 0.82
            const jobType = booking.jobs?.type?.replace(/_/g, ' ')

            return (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                      {jobType}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/carrier/jobs/${booking.jobs?.id}`}
                    className="text-xs text-gray-400 hover:text-gray-700 shrink-0"
                  >
                    View job →
                  </Link>
                </div>

                <p className="text-sm font-medium text-gray-800 mb-1">
                  {booking.jobs?.pickup_address?.split(',')[0]} →{' '}
                  {booking.jobs?.delivery_address?.split(',')[0]}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {booking.jobs?.pickup_address} → {booking.jobs?.delivery_address}
                </p>

                {/* Earnings breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Quote price</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₹{price.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Platform fee (18%)</p>
                    <p className="text-sm font-bold text-red-500">
                      −₹{platformFee.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Your earnings</p>
                    <p className="text-sm font-bold text-green-600">
                      ₹{earnings.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
