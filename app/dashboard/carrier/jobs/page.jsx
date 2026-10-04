import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatJobMoveWindow } from '@/lib/quotes'
import ProfileChecklist from '@/components/ProfileChecklist'
import { loadChecklist } from '@/lib/carrier-profile'

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

  const checklist = await loadChecklist(user.id)

  // Carrier not approved yet
  if (carrier?.application_status !== 'active') {
    return (
      <div className="py-10">
        <p className="mb-6 text-center text-gray-500">
          Your account is pending approval. Check back soon.
        </p>
        <ProfileChecklist
          checklist={checklist}
          intro="While we review your application, finish these steps. You'll need all of them before you can quote on jobs."
        />
      </div>
    )
  }

  // Jobs still taking quotes (including ones other carriers already quoted on)
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .in('status', ['open', 'quoted'])
    .in('type', carrier.service_categories || [])
    .order('created_at', { ascending: false })
    .limit(30)

  function getShortAddress(address) {
    if (!address) return ''

    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)

    if (parts.length >= 2) {
      return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    }

    return address
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>

      <ProfileChecklist
        checklist={checklist}
        intro="You can browse jobs now, but you need to finish these steps before you can quote."
      />

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
                    Pickup: {getShortAddress(job.pickup_address)}
                  </p>

                  <p className="text-gray-400 text-sm my-1">↓</p>

                  <p className="font-medium text-gray-800">
                    Delivery: {getShortAddress(job.delivery_address)}
                  </p>

                  <p className="text-sm text-gray-400 mt-3">
                    {formatJobMoveWindow(job)}
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
