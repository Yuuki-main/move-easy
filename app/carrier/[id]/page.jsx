import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ExpandableDescription from './ExpandableDescription'

export default async function CarrierProfilePage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const [
    { data: carrier },
    { data: reviews, count: reviewCount },
    { count: totalJobs },
  ] = await Promise.all([
    supabase.from('carrier_profiles').select('*').eq('id', id).single(),
    supabase
      .from('reviews')
      .select('*, jobs(type, pickup_address, delivery_address)', { count: 'exact' })
      .eq('carrier_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('carrier_id', id)
      .eq('status', 'completed'),
  ])

  if (!carrier) {
    return <p className="text-center py-24 text-gray-400">Carrier not found.</p>
  }

  const avgRating =
    reviews?.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null

  const displayedReviews = reviews?.slice(0, 3) ?? []
  const paymentMethods = carrier.payment_methods ?? []
  const serviceCategories = carrier.service_categories ?? []
  const carrierPhotos = carrier.photos ?? []

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        {/* ── Left column ── */}
        <div>
          {/* Hero image */}
          {carrierPhotos[0] && (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden mb-6 bg-gray-100">
              <Image
                src={carrierPhotos[0]}
                alt={carrier.public_name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>
          )}

          {/* Photo gallery */}
          {carrierPhotos.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
              {carrierPhotos.slice(1).map((photo, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <Image
                    src={photo}
                    alt={`${carrier.public_name} photo ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Header */}
          <h1 className="text-3xl font-black text-gray-900 mb-1">
            {carrier.public_name}
          </h1>
          {carrier.application_status === 'active' && (
            <p className="text-sm text-gray-400 mb-5">
              <span className="text-blue-500 font-bold">✓</span> Quality and
              service verified
            </p>
          )}

          {/* Feature list */}
          <div className="space-y-3 mb-6">
            {avgRating && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">⭐</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    Rated {avgRating} out of 10
                  </span>
                  {' — '}based on {reviewCount} reviews
                </p>
              </div>
            )}
            {(totalJobs ?? 0) > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">✅</span>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">
                    {Number(totalJobs).toLocaleString('en-IN')} jobs completed
                  </span>{' '}
                  across India
                </p>
              </div>
            )}
            {carrier.city && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">📍</span>
                <p className="text-sm text-gray-700">
                  Based in{' '}
                  <span className="font-semibold">{carrier.city}</span>
                </p>
              </div>
            )}
            {carrier.application_status === 'active' && (
              <div className="flex items-start gap-3">
                <span className="text-base shrink-0 mt-0.5">🏆</span>
                <p className="text-sm font-semibold text-gray-700">
                  Verified carrier
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 mb-6" />

          {/* Description card */}
          {carrier.profile_description && (
            <>
              <ExpandableDescription
                name={carrier.public_name}
                description={carrier.profile_description}
              />
              <div className="border-t border-gray-100 my-6" />
            </>
          )}

          {/* Who you'll be booking */}
          <div className="mb-6">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Who you&apos;ll be booking
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              {carrier.profile_description ??
                `${carrier.public_name} provides professional moving services across India with a customer-focused approach and competitive pricing.`}
            </p>
          </div>

          <div className="border-t border-gray-100 mb-6" />

          {/* Payment methods */}
          {paymentMethods.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Payment methods
                </h3>
                <p className="text-sm text-gray-600">
                  {paymentMethods.join(' • ')}
                </p>
              </div>
              <div className="border-t border-gray-100 mb-6" />
            </>
          )}

          {/* Service categories */}
          {serviceCategories.length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3">
                  Services offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((cat) => (
                    <span
                      key={cat}
                      className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full capitalize"
                    >
                      {cat.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 mb-6" />
            </>
          )}

          {/* Reviews */}
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-4">
              Reviews{reviewCount ? ` (${reviewCount})` : ''}
            </h3>
            {!displayedReviews.length ? (
              <p className="text-sm text-gray-400">No reviews yet.</p>
            ) : (
              <div className="space-y-5">
                {displayedReviews.map((r, i) => {
                  const pickupCity = r.jobs?.pickup_address
                    ?.split(',')[0]
                    ?.trim()
                  const deliveryCity = r.jobs?.delivery_address
                    ?.split(',')[0]
                    ?.trim()
                  const route =
                    pickupCity && deliveryCity
                      ? `${pickupCity} → ${deliveryCity}`
                      : null
                  const reviewDate = new Date(r.created_at).toLocaleDateString(
                    'en-IN',
                    { day: 'numeric', month: 'long', year: 'numeric' },
                  )

                  return (
                    <div
                      key={i}
                      className="border-b border-gray-100 pb-5 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="w-10 h-10 bg-gray-900 text-white rounded-lg font-black text-lg flex items-center justify-center shrink-0">
                          {r.rating}
                        </span>
                        <div>
                          {route && (
                            <p className="text-xs text-gray-500 font-medium">
                              {route}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">{reviewDate}</p>
                        </div>
                      </div>
                      {r.comment && (
                        <div className="flex gap-2 mt-2">
                          <span className="text-3xl text-gray-200 font-black leading-none select-none">
                            &ldquo;&ldquo;
                          </span>
                          <p className="text-sm text-gray-600 italic leading-relaxed">
                            {r.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {(reviewCount ?? 0) > 3 && (
              <p className="text-sm text-gray-400 mt-4">
                Showing 3 of {reviewCount} reviews
              </p>
            )}
          </div>
        </div>

        {/* ── Right sticky column ── */}
        <div className="sticky top-6 self-start">
          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
            {avgRating ? (
              <>
                <p className="text-6xl font-black text-gray-900 leading-none">
                  {avgRating}
                </p>
                <p className="text-sm text-gray-400 mt-1 mb-5">
                  Based on {reviewCount} reviews
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-400 mb-5">No reviews yet</p>
            )}

            {serviceCategories.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Services
                </p>
                <ul className="space-y-1">
                  {serviceCategories.map((cat) => (
                    <li key={cat} className="text-sm text-gray-700 capitalize">
                      {cat.replace(/_/g, ' ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {carrier.city && (
              <div className="mb-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Location
                </p>
                <p className="text-sm text-gray-700">{carrier.city}</p>
              </div>
            )}

            <Link
              href="/get-prices"
              className="w-full block text-center bg-gray-900 hover:bg-gray-700 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm transition-all duration-200"
            >
              Request this carrier
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
