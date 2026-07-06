import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function MyJobsPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*, quotes(count)')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 pt-8">
      <h1 className="text-xl font-bold mb-6">My Move Requests</h1>
      {!jobs?.length ? (
        <p className="text-gray-400 text-center py-20">No requests yet.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 capitalize">
                    {job.type.replace('_', ' ')}
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {job.pickup_address} → {job.delivery_address}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">
                    Status: {job.status}
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">
                  {job.quotes?.[0]?.count ?? 0} quote(s) →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
