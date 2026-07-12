import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default async function CustomerDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: jobs }, { data: profile }] = await Promise.all([
    supabase
      .from('jobs')
      .select('*, quotes(id, price, status)')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('first_name, role')
      .eq('id', user.id)
      .single(),
  ])

  if (profile?.role === 'carrier') redirect('/dashboard/carrier')

  // Alert banner logic
  const jobsWithPendingQuotes =
    jobs?.filter(
      (job) =>
        job.quotes?.some((q) => q.status === 'pending') && job.status === 'open',
    ) ?? []

  const allPendingQuotes = jobsWithPendingQuotes
    .flatMap((j) => j.quotes.filter((q) => q.status === 'pending'))
    .sort((a, b) => a.price - b.price)

  const lowestQuote = allPendingQuotes[0]
  const totalPendingQuotes = allPendingQuotes.length

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16 pt-10">
      {/* Greeting */}
      <h1 className="text-5xl font-black text-gray-900 mb-8">
        Hi {profile?.first_name}
      </h1>

      {/* Sub-nav */}
      <nav className="flex gap-6 border-b border-gray-200 mb-8">
        <Link
          href="/get-prices"
          className="pb-3 text-sm text-gray-500 hover:text-gray-900"
        >
          Get Prices
        </Link>
        <Link
          href="/dashboard"
          className="pb-3 text-sm font-bold text-gray-900 border-b-2 border-gray-900"
        >
          My Deliveries ({jobs?.length ?? 0})
        </Link>
        <Link
          href="/dashboard/account"
          className="pb-3 text-sm text-gray-500 hover:text-gray-900"
        >
          Account
        </Link>
        <LogoutButton />
      </nav>

      {/* Alert banner — only when there are pending quotes */}
      {jobsWithPendingQuotes.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 px-5 py-4 mb-8 rounded-r-xl">
          <p className="text-base font-bold text-gray-900">
            Confirm quote — you have{' '}
            <strong>
              {totalPendingQuotes} quote{totalPendingQuotes > 1 ? 's' : ''}
            </strong>
            {lowestQuote &&
              `, lowest at $${Number(lowestQuote.price).toLocaleString('en-NZ')}`}
          </p>
        </div>
      )}

      {/* Jobs list */}
      {!jobs?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">There are no deliveries here —</p>
          <Link
            href="/get-prices"
            className="text-blue-600 font-semibold hover:underline"
          >
            Get Prices
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {jobs.map((job) => {
            const pendingQuotes =
              job.quotes?.filter((q) => q.status === 'pending') ?? []
            const lowestPrice = [...pendingQuotes].sort(
              (a, b) => a.price - b.price,
            )[0]?.price

            return (
              <Link
                key={job.id}
                href={`/dashboard/jobs/${job.id}`}
                className="flex items-center justify-between py-5 hover:bg-gray-50 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="font-bold text-gray-900 capitalize mb-1">
                    {job.type?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-sm text-gray-400">
                    {job.pickup_address?.split(',')[0]} →{' '}
                    {job.delivery_address?.split(',')[0]}
                  </p>
                </div>
                <div className="text-right">
                  {pendingQuotes.length > 0 ? (
                    <div>
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-1">
                        {pendingQuotes.length} quote
                        {pendingQuotes.length > 1 ? 's' : ''}
                      </span>
                      {lowestPrice && (
                        <p className="text-xs text-gray-400">
                          from ${Number(lowestPrice).toLocaleString('en-NZ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full capitalize ${
                        job.status === 'booked'
                          ? 'bg-green-100 text-green-700'
                          : job.status === 'open'
                            ? 'bg-gray-100 text-gray-500'
                            : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {job.status}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
