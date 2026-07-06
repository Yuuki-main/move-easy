import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function CarrierJobsPage() {
  const supabase = await createClient()
  // Get logged in user
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Prevent crash if user is somehow null
  if (!session) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Please sign in to continue.</p>
      </div>
    )
  }

  const user = session.user

  // Get carrier profile
  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select(
      `
      service_categories,
      service_cities,
      application_status
    `,
    )
    .eq('id', user.id)
    .single()

  // Carrier not approved yet
  if (carrier?.application_status !== 'active') {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">
          Your account is pending approval. Check back soon.
        </p>
      </div>
    )
  }

  // Fetch jobs matching carrier categories
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'open')
    .in('type', carrier.service_categories || [])
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>

      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400">No jobs available right now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/dashboard/carrier/jobs/${job.id}`}
              className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-teal-500 hover:shadow-sm transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="inline-block mb-3 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold capitalize">
                    {job.type?.replace('_', ' ')}
                  </span>

                  <p className="font-medium text-gray-800">
                    {job.pickup_address}
                  </p>

                  <p className="text-gray-400 text-sm my-1">↓</p>

                  <p className="font-medium text-gray-800">
                    {job.delivery_address}
                  </p>

                  {/* Use whichever date field exists in your schema */}
                  <p className="text-sm text-gray-400 mt-3">
                    {job.move_date
                      ? new Date(job.move_date).toLocaleDateString()
                      : job.move_date_from
                        ? `${new Date(
                            job.move_date_from,
                          ).toLocaleDateString()} ${
                            job.move_date_to
                              ? `- ${new Date(
                                  job.move_date_to,
                                ).toLocaleDateString()}`
                              : ''
                          }`
                        : 'Flexible date'}
                  </p>

                  <p className="text-xs text-gray-400 mt-1">
                    Posted on {new Date(job.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-sm text-teal-600 font-medium">View →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
