import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import AcceptQuoteButton from '../../AcceptQuoteButton'
import MessageThread from '@/components/MessageThread'
import CarrierDescriptionCard from './CarrierDescriptionCard'

export default async function QuoteDetailPage({ params }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user
  const { id: jobId, quoteId } = await params

  const [{ data: quote }, { data: job }] = await Promise.all([
    supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .eq('job_id', jobId)
      .single(),
    supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('customer_id', user.id)
      .single(),
  ])

  if (!quote || !job) {
    return <p className="text-center py-20 text-gray-400">Quote not found.</p>
  }

  const [
    { data: carrier },
    { data: recentReviews, count: reviewCount },
    { data: ratingsData },
    { count: jobsCompleted },
    { count: activeQuotes },
  ] = await Promise.all([
    supabase
      .from('carrier_profiles')
      .select('*')
      .eq('id', quote.carrier_id)
      .single(),
    supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .eq('carrier_id', quote.carrier_id)
      .order('created_at', { ascending: false })
      .limit(1),
    supabase
      .from('reviews')
      .select('rating')
      .eq('carrier_id', quote.carrier_id),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('carrier_id', quote.carrier_id),
    supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('carrier_id', quote.carrier_id)
      .eq('status', 'pending'),
  ])

  const recentReview = recentReviews?.[0] ?? null
  const avgRating =
    ratingsData?.length
      ? (
          ratingsData.reduce((s, r) => s + r.rating, 0) / ratingsData.length
        ).toFixed(1)
      : null

  const jobTypeLabel = job.type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const pickupCity = job.pickup_address.split(',')[0].trim()
  const deliveryCity = job.delivery_address.split(',')[0].trim()
  const routeLabel = `${pickupCity} to ${deliveryCity} ${jobTypeLabel} run`

  const isAccepted = quote.status === 'accepted'
  const isRejected = quote.status === 'rejected'
  const canAccept = job.status !== 'booked' && !isAccepted && !isRejected

  const paymentMethods = carrier?.payment_methods ?? []
  const paymentTimeframes = carrier?.payment_timeframes ?? []
  const carrierPhotos = carrier?.photos ?? []
  const carrierAvatar = carrierPhotos[0] ?? null

  const moveDateDisplay = job.move_date
    ? new Date(job.move_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const reviewDateDisplay = recentReview
    ? new Date(recentReview.created_at).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  const ratingLabel =
    recentReview?.rating >= 8
      ? 'exceptional'
      : recentReview?.rating >= 6
        ? 'great'
        : 'average'

  return (
    <div className="max-w-5xl mx-auto px-4 pb-8">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/jobs/${jobId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4"
      >
        ← Back to quotes
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{jobTypeLabel}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
        {/* ── Left column ── */}
        <div>
          {/* Hero image */}
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-gray-100">
            {carrierAvatar ? (
              <Image
                src={carrierAvatar}
                alt={carrier.public_name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <span className="text-6xl">🚛</span>
              </div>
            )}
          </div>

          {/* Photos section */}
          {carrierPhotos.length > 1 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                Photos
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {carrierPhotos.map((photo, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <Image
                      src={photo}
                      alt={`${carrier.public_name} photo ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 33vw, 25vw"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Carrier header row */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              {carrierAvatar ? (
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 shrink-0 relative">
                  <Image
                    src={carrierAvatar}
                    alt={carrier.public_name}
                    fill
                    className="object-cover"
                    sizes="36px"
                  />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {carrier?.public_name?.[0]?.toUpperCase() ?? 'C'}
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-[15px]">
                  {carrier?.public_name ?? 'Carrier'}
                </p>
                {carrier?.application_status === 'active' && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <span className="text-blue-500 font-bold">✓</span>
                    Quality and service verified
                  </div>
                )}
                <Link
                  href={`/carrier/${quote.carrier_id}`}
                  className="text-xs text-gray-400 underline hover:text-gray-700 mt-0.5 inline-block"
                >
                  View public profile →
                </Link>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                ₹{Number(quote.price).toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-gray-400 leading-snug">
                final price
                <br />
                no hidden costs
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 mb-5" />

          {/* Feature bullets */}
          <div className="space-y-3 mb-5">
            {avgRating && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">⭐</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Rated {avgRating} out of 10
                  </span>
                  {' — '}
                  <Link
                    href="/reviews"
                    className="underline text-gray-500 hover:text-gray-900"
                  >
                    exceptional reviews
                  </Link>
                </p>
              </div>
            )}

            {(jobsCompleted ?? 0) > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">✅</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {Number(jobsCompleted).toLocaleString('en-IN')} jobs
                    completed
                  </span>{' '}
                  across India
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <span className="text-base shrink-0 mt-0.5">🗺️</span>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{routeLabel}</span>
              </p>
            </div>

            {carrier?.application_status === 'active' && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🏆</span>
                <p className="text-sm font-semibold text-gray-700">
                  Verified carrier
                </p>
              </div>
            )}

            {(activeQuotes ?? 0) > 1 && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">⏰</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Filling fast — don&apos;t miss out
                  </span>
                  {' — '}
                  <span className="text-gray-500">
                    Carrier has {activeQuotes} other active quotes right now
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Carrier description card */}
          {carrier?.profile_description && (
            <>
              <div className="border-t border-gray-100 mb-5" />
              <CarrierDescriptionCard
                name={carrier.public_name}
                description={carrier.profile_description}
              />
            </>
          )}

          {/* Who you'll be booking */}
          <div className="border-t border-gray-100 my-5" />
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Who you&apos;ll be booking
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {carrier?.profile_description ??
                `${carrier?.public_name ?? 'This carrier'} provides professional moving services across India with a customer-focused approach and competitive pricing.`}
            </p>
          </div>

          {/* Detail rows */}
          <div className="border-t border-gray-100 my-5" />
          <div className="divide-y divide-gray-100">
            <div className="flex items-start justify-between py-3 text-sm">
              <span className="text-gray-400 shrink-0 w-36">Time frame</span>
              <span className="text-gray-700 text-right">
                {moveDateDisplay
                  ? `${moveDateDisplay} · delivery date flexible`
                  : 'collection date flexible · delivery date flexible'}
              </span>
            </div>

            {paymentTimeframes.length > 0 && (
              <div className="flex items-start justify-between py-3 text-sm">
                <span className="text-gray-400 shrink-0 w-36">
                  Payment option
                </span>
                <span className="text-gray-700 text-right">
                  {paymentTimeframes.join(' · ')}
                </span>
              </div>
            )}

            {paymentMethods.length > 0 && (
              <div className="flex items-start justify-between py-3 text-sm">
                <span className="text-gray-400 shrink-0 w-36">
                  Payment method
                </span>
                <span className="text-gray-700 text-right">
                  {paymentMethods.join(' · ')}
                </span>
              </div>
            )}
          </div>

          {/* Message thread */}
          <div className="border-t border-gray-100 my-5" />
          <MessageThread
            jobId={jobId}
            currentUserId={user.id}
            receiverId={quote.carrier_id}
          />

          {/* Recent review */}
          {recentReview && (
            <>
              <div className="border-t border-gray-100 my-5" />
              <div>
                <p className="text-base font-bold text-gray-900 mb-4">
                  A recent review was rated as{' '}
                  <span className="bg-gray-900 text-white text-sm font-bold px-2 py-0.5 rounded-md">
                    {ratingLabel}
                  </span>{' '}
                  from{' '}
                  <span className="underline cursor-default">Customer</span>
                </p>
                <div className="flex gap-2">
                  <span className="text-3xl text-gray-200 font-black leading-none select-none">
                    &ldquo;&ldquo;
                  </span>
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {recentReview.comment}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Reviewed {reviewDateDisplay}
                    </p>
                  </div>
                </div>
                <Link
                  href="/reviews"
                  className="text-sm text-gray-500 underline hover:text-gray-900 mt-3 inline-block"
                >
                  Read all ({reviewCount ?? 0}) reviews
                </Link>
              </div>
            </>
          )}

          {/* Bottom close */}
          <div className="border-t border-gray-100 mt-8 pt-4 text-center">
            <Link
              href={`/dashboard/jobs/${jobId}`}
              className="text-sm text-gray-400 hover:text-gray-700 underline"
            >
              close
            </Link>
          </div>
        </div>

        {/* ── Right sticky column ── */}
        <div className="sticky top-6">
          <div className="border border-gray-200 rounded-2xl p-5 bg-white shadow-sm">
            <p className="text-3xl font-bold text-gray-900">
              ₹{Number(quote.price).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              final price
              <br />
              no hidden costs
            </p>

            <div className="mt-4">
              {isAccepted ? (
                <div className="w-full bg-green-50 border border-green-100 text-green-700 text-sm font-semibold py-3 rounded-xl text-center">
                  ✓ Quote Accepted
                </div>
              ) : isRejected ? (
                <div className="w-full bg-gray-50 text-gray-400 text-sm font-semibold py-3 rounded-xl text-center">
                  Not selected
                </div>
              ) : canAccept ? (
                <>
                  <AcceptQuoteButton
                    quoteId={quote.id}
                    jobId={jobId}
                    variant="primary"
                  />
                  <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                    Secure your quote now, don&apos;t miss out.{' '}
                    <span>🏷️</span>
                  </p>
                </>
              ) : null}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4 px-2">
            Secure a quote by accepting it now.
          </p>
        </div>
      </div>
    </div>
  )
}
