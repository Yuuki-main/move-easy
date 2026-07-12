import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-gray-100 text-gray-400',
}

const STATUS_LABELS = {
  pending: '⏳ Pending',
  accepted: '✓ Accepted',
  rejected: 'Not selected',
}

export default async function CarrierQuotesPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user
  const { data: quotes } = await supabase
    .from('quotes')
    .select(
      `
      *,
      jobs (
        id,
        type,
        pickup_address,
        delivery_address,
        status,
        created_at
      )
    `,
    )
    .eq('carrier_id', user.id)
    .order('created_at', { ascending: false })

  const accepted = quotes?.filter((q) => q.status === 'accepted') ?? []
  const pending = quotes?.filter((q) => q.status === 'pending') ?? []
  const rejected = quotes?.filter((q) => q.status === 'rejected') ?? []

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold mb-2">My Quotes</h1>
      <p className="text-sm text-gray-400 mb-8">
        All quotes you have submitted to customers.
      </p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          {
            label: 'Pending',
            count: pending.length,
            style: 'bg-yellow-50 text-yellow-700',
          },
          {
            label: 'Accepted',
            count: accepted.length,
            style: 'bg-green-50 text-green-700',
          },
          {
            label: 'Not selected',
            count: rejected.length,
            style: 'bg-gray-50 text-gray-500',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-xl p-4 text-center ${s.style}`}
          >
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-xs font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quotes list */}
      {!quotes?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-400 text-sm">No quotes submitted yet.</p>
          <Link
            href="/dashboard/carrier/jobs"
            className="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Browse available jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Link
              key={quote.id}
              href={`/dashboard/carrier/jobs/${quote.jobs?.id}`}
              className="block bg-white rounded-xl border border-gray-200 px-5 py-4 hover:border-blue-400 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full capitalize">
                      {quote.jobs?.type?.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[quote.status]}`}
                    >
                      {STATUS_LABELS[quote.status]}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {quote.jobs?.pickup_address} →{' '}
                    {quote.jobs?.delivery_address}
                  </p>
                  {quote.message && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      &quot;{quote.message}&quot;
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Quoted on {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-blue-600">
                    ${quote.price}
                  </p>
                  {quote.status === 'accepted' && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      View booking →
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
