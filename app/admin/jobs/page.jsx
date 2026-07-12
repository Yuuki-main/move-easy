import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_STYLES = {
  open: 'bg-blue-100 text-blue-700',
  quoted: 'bg-yellow-100 text-yellow-700',
  booked: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-500',
}

export default async function AdminJobsPage() {
  const supabase = await createClient()

  const { data: jobs } = await supabase
    .from('jobs')
    .select(
      `
      *,
      profiles!customer_id (first_name),
      quotes (count)
    `,
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const total = jobs?.length ?? 0
  const byStatus = (s) => jobs?.filter((j) => j.status === s).length ?? 0

  return (
    <div>
      <h1 className="text-xl font-bold mb-2">All Jobs</h1>
      <p className="text-sm text-gray-400 mb-8">Every job posted on the platform.</p>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total', count: total, style: 'bg-gray-50 text-gray-700' },
          { label: 'Open', count: byStatus('open'), style: 'bg-blue-50 text-blue-700' },
          { label: 'Quoted', count: byStatus('quoted'), style: 'bg-yellow-50 text-yellow-700' },
          { label: 'Booked', count: byStatus('booked'), style: 'bg-green-50 text-green-700' },
          { label: 'Completed', count: byStatus('completed'), style: 'bg-gray-50 text-gray-500' },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 text-center ${s.style}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {!jobs?.length ? (
        <p className="text-center py-20 text-gray-400 text-sm">No jobs yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Type
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Route
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Customer
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Quotes
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {jobs.map((job) => {
                  const pickupCity = job.pickup_address?.split(',')[0]?.trim()
                  const deliveryCity = job.delivery_address?.split(',')[0]?.trim()
                  const quoteCount = job.quotes?.[0]?.count ?? 0

                  return (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                          {job.type?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 max-w-[200px] truncate">
                        {pickupCity} → {deliveryCity}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {job.profiles?.first_name ?? '—'}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">
                        {quoteCount}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                            STATUS_STYLES[job.status] ?? 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(job.created_at).toLocaleDateString('en-NZ', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/jobs/${job.id}`}
                          className="text-xs text-gray-400 hover:text-gray-700"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
