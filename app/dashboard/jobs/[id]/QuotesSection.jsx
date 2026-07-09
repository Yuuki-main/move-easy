'use client'

import { useState } from 'react'
import Link from 'next/link'
import AcceptQuoteButton from './AcceptQuoteButton'
import PreBookingMessage from './PreBookingMessage'

export default function QuotesSection({ quotes, job, userId }) {
  const [expanded, setExpanded] = useState(null)

  if (!quotes?.length) {
    return (
      <p className="text-gray-400 text-sm py-10 text-center">
        No quotes yet. Carriers will respond soon.
      </p>
    )
  }

  return (
    <div className="border border-gray-200 rounded-sm divide-y divide-gray-100">
      {quotes.map((quote) => {
        const carrier = quote.carrier ?? {}
        const recentReview = quote.recentReview ?? null
        const isExpanded = expanded === quote.id
        const isAccepted = quote.status === 'accepted'
        const isRejected = quote.status === 'rejected'
        const canAccept = job.status !== 'booked' && !isAccepted && !isRejected

        const ratingLabel =
          recentReview?.rating >= 8
            ? 'exceptional'
            : recentReview?.rating >= 6
              ? 'great'
              : 'average'

        const heroImage = carrier?.photos?.[0] ?? '/main/moving_hero_img.jpg'

        return (
          <div key={quote.id}>
            {/* ── Collapsed row ── */}
            <div
              onClick={() => setExpanded(isExpanded ? null : quote.id)}
              className="flex items-center justify-between px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-medium text-gray-900 text-sm">
                  {carrier.public_name ?? quote.carrier_profiles?.public_name ?? 'Carrier'}
                </span>
                {carrier.average_rating > 0 && (
                  <span className="bg-gray-900 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                    {Number(carrier.average_rating).toFixed(1)}
                  </span>
                )}
                {isAccepted && (
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                    ✓ Accepted
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isRejected ? (
                  <span className="text-sm text-gray-400">Not selected</span>
                ) : (
                  <span className="font-bold text-gray-900 text-sm">
                    ₹{Number(quote.price).toLocaleString('en-IN')}
                  </span>
                )}
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* ── Expanded panel ── */}
            {isExpanded && (
              <div className="border-t border-gray-100 bg-white">
                {/* Hero image */}
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={heroImage}
                    alt={carrier.public_name ?? 'Carrier'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="p-6">
                  {/* Carrier header */}
                  <div className="flex items-start justify-between mb-6 pb-5 border-b border-gray-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                          {carrier.public_name?.[0]?.toUpperCase() ?? 'C'}
                        </div>
                        <span className="font-bold text-gray-900">
                          {carrier.public_name ?? 'Carrier'}
                        </span>
                        {carrier.application_status === 'active' && (
                          <span className="text-blue-500 text-xs font-bold">✓</span>
                        )}
                      </div>
                      {carrier.application_status === 'active' && (
                        <p className="text-xs text-gray-400 ml-10">
                          Quality and service verified
                        </p>
                      )}
                      <Link
                        href={`/carrier/${quote.carrier_id}`}
                        className="text-xs text-gray-400 underline hover:text-gray-700 ml-10 mt-0.5 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View full profile →
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900">
                        ₹{Number(quote.price).toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-gray-400">final price</p>
                      <p className="text-xs text-gray-400">no hidden costs</p>
                    </div>
                  </div>

                  {/* Feature list */}
                  <div className="space-y-3 mb-6 pb-5 border-b border-gray-100">
                    {carrier.average_rating > 0 && (
                      <div className="flex items-start gap-3">
                        <span className="text-base shrink-0 mt-0.5">⭐</span>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">
                            Rated {carrier.average_rating} out of 10
                          </span>
                          {' — '}
                          <Link
                            href={`/carrier/${quote.carrier_id}`}
                            className="underline text-gray-500 hover:text-gray-900"
                            onClick={(e) => e.stopPropagation()}
                          >
                            exceptional reviews
                          </Link>
                        </p>
                      </div>
                    )}
                    {carrier.city && (
                      <div className="flex items-start gap-3">
                        <span className="text-base shrink-0 mt-0.5">📍</span>
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">
                            {carrier.city} area specialist
                          </span>
                          {carrier.service_cities?.length > 0 && (
                            <span className="text-gray-400">
                              {' '}— serving {carrier.service_cities.slice(0, 3).join(', ')}
                            </span>
                          )}
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
                    <div className="flex items-start gap-3">
                      <span className="text-base shrink-0 mt-0.5">⏰</span>
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          Filling fast — don&apos;t miss out
                        </span>
                        <span className="text-gray-400">
                          {' '}— Carrier has other active quotes right now
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Carrier description */}
                  {carrier.profile_description && (
                    <div className="mb-6 pb-5 border-b border-gray-100">
                      <p className="font-bold text-sm text-gray-900 mb-1">
                        {carrier.public_name}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                        {carrier.profile_description}
                      </p>
                      <Link
                        href={`/carrier/${quote.carrier_id}`}
                        className="text-xs font-bold uppercase tracking-widest mt-2 text-gray-900 hover:underline inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read more
                      </Link>
                    </div>
                  )}

                  {/* Who you'll be booking */}
                  <div className="mb-6 pb-5 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-900 mb-2">
                      Who you&apos;ll be booking
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {carrier.profile_description ??
                        `${carrier.public_name ?? 'This carrier'} provides professional moving services across New Zealand with a customer-focused approach and competitive pricing.`}
                    </p>
                  </div>

                  {/* Time frame + payment */}
                  <div className="divide-y divide-gray-100 mb-6 pb-5 border-b border-gray-100 text-sm">
                    <div className="flex items-start justify-between py-3">
                      <span className="text-gray-400 shrink-0 w-36">Time frame</span>
                      <span className="text-gray-700 text-right">
                        {job.move_date
                          ? new Date(job.move_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'collection date flexible · delivery date flexible'}
                      </span>
                    </div>
                    {carrier.payment_methods?.length > 0 && (
                      <div className="flex items-start justify-between py-3">
                        <span className="text-gray-400 shrink-0 w-36">Payment method</span>
                        <span className="text-gray-700 text-right">
                          {carrier.payment_methods.join(' · ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Pre-booking message */}
                  {job.status !== 'booked' && (
                    <div className="mb-6 pb-5 border-b border-gray-100">
                      <PreBookingMessage jobId={job.id} carrierId={quote.carrier_id} />
                    </div>
                  )}

                  {/* Most recent review */}
                  {recentReview && (
                    <div className="mb-6 pb-5 border-b border-gray-100">
                      <p className="text-base font-bold text-gray-900 mb-4">
                        A recent review was rated as{' '}
                        <span className="bg-gray-900 text-white text-sm font-bold px-2 py-0.5 rounded-md">
                          {ratingLabel}
                        </span>
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
                            Reviewed{' '}
                            {new Date(recentReview.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/carrier/${quote.carrier_id}`}
                        className="text-sm text-gray-500 underline hover:text-gray-900 mt-3 inline-block"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Read all reviews →
                      </Link>
                    </div>
                  )}

                  {/* Accept button */}
                  {canAccept && (
                    <div
                      className="sticky bottom-0 bg-white pt-4 border-t border-gray-100"
                      onClick={() => setExpanded(null)}
                    >
                      <AcceptQuoteButton quoteId={quote.id} jobId={job.id} variant="primary" />
                      <p className="text-xs text-gray-400 text-center mt-2">
                        Secure your quote now, don&apos;t miss out.
                      </p>
                    </div>
                  )}

                  {isAccepted && (
                    <div className="text-center py-3">
                      <span className="bg-green-100 text-green-700 text-sm font-semibold px-4 py-2 rounded-full">
                        ✓ Quote Accepted
                      </span>
                    </div>
                  )}

                  {/* Close */}
                  <button
                    onClick={() => setExpanded(null)}
                    className="w-full text-center text-sm text-gray-400 underline mt-4 hover:text-gray-700"
                  >
                    close
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
