import Link from 'next/link'
import { BadgeCheck, Leaf, MapPinned, Star, Truck } from 'lucide-react'
import AmendQuoteMenu from './AmendQuoteMenu'
import {
  effectivePaymentTerms,
  formatCollectionWindow,
  formatMoney,
  isQuoteExpired,
  shortAddress,
} from '@/lib/quotes'

const fmtStamp = (d) =>
  new Date(d).toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

// The carrier's own quote, laid out the way the customer sees it, with the
// amend controls in the price box.
export default function MyQuotePreview({
  quote,
  job,
  carrier,
  jobsCompleted,
  insurance,
  lowestOther,
  canAmend,
}) {
  const photos = carrier?.photos ?? []
  const hero = photos[0] ?? '/main/moving_hero_img.jpg'
  const terms = effectivePaymentTerms(quote, carrier)
  const expired = isQuoteExpired(quote)
  const rating = Number(carrier?.average_rating) || 0
  const priceChanged =
    quote.previous_price != null && Number(quote.previous_price) !== Number(quote.price)

  return (
    <div>
      <div className="relative h-44 overflow-hidden sm:h-56">
        <img src={hero} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
        <p className="absolute right-3 top-3 rounded-full bg-gray-900/70 px-2.5 py-1 text-[11px] font-medium text-white">
          Customer view
        </p>
      </div>

      <div className="grid gap-6 px-5 pb-5 sm:grid-cols-[1fr_220px]">
        {/* Left: who + details */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-600">
              {photos[0] ? (
                <img src={photos[0]} alt="" className="h-full w-full object-cover" />
              ) : (
                carrier?.public_name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-gray-900">{carrier?.public_name}</p>
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <BadgeCheck size={13} className="text-teal-600" />
                Quality and service verified
              </p>
            </div>
          </div>

          <ul className="space-y-2.5 border-y border-gray-100 py-4 text-sm">
            {rating > 0 && (
              <li className="flex gap-2.5">
                <Star size={16} className="mt-0.5 shrink-0 text-gray-400" />
                <span className="text-gray-700">
                  <span className="font-semibold text-gray-900">Rated {rating.toFixed(1)} / 10</span>
                  {carrier?.total_reviews > 0 && (
                    <span className="text-gray-500"> · {carrier.total_reviews} reviews</span>
                  )}
                </span>
              </li>
            )}
            <li className="flex gap-2.5">
              <Truck size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {jobsCompleted} job{jobsCompleted === 1 ? '' : 's'} completed
                <span className="font-normal text-gray-500"> across New Zealand</span>
              </span>
            </li>
            <li className="flex gap-2.5">
              <MapPinned size={16} className="mt-0.5 shrink-0 text-gray-400" />
              <span className="text-gray-700">
                {shortAddress(job.pickup_address)} → {shortAddress(job.delivery_address)}
              </span>
            </li>
            {quote.electric_vehicle && (
              <li className="flex gap-2.5">
                <Leaf size={16} className="mt-0.5 shrink-0 text-teal-600" />
                <span className="font-semibold text-teal-700">Electric vehicle move</span>
              </li>
            )}
          </ul>

          {photos.length > 1 && (
            <div className="border-b border-gray-100 py-4">
              <p className="mb-2 text-sm font-bold text-gray-900">Photos</p>
              <div className="grid grid-cols-5 gap-1.5">
                {photos.slice(0, 5).map((src, i) => (
                  <div key={`${i}-${src}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100">
                    <img src={src} alt="" className="h-full w-full object-cover" />
                    {i === 4 && photos.length > 5 && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs font-semibold text-white">
                        +{photos.length - 5}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {carrier?.profile_description && (
            <div className="border-b border-gray-100 py-4">
              <p className="mb-1 text-sm font-bold text-gray-900">Who they&apos;ll be booking</p>
              <p className="line-clamp-3 text-sm leading-relaxed text-gray-600">
                {carrier.profile_description}
              </p>
              <Link
                href="/dashboard/carrier/settings"
                className="mt-1 inline-block text-xs font-semibold text-teal-700 hover:underline"
              >
                Edit profile
              </Link>
            </div>
          )}

          {quote.message && (
            <div className="border-b border-gray-100 py-4">
              <p className="mb-1 text-sm font-bold text-gray-900">Your note</p>
              <p className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {quote.message}
              </p>
            </div>
          )}

          <dl className="divide-y divide-gray-100 text-sm">
            <Row label="Time frame" value={formatCollectionWindow(quote)} />
            <Row label="Payment option" value={terms.timeframes.join(' · ') || '—'} />
            <Row label="Payment method" value={terms.methods.join(' · ') || '—'} />
            <Row
              label="Insurance"
              value={
                insurance.length ? (
                  <span className="flex flex-col items-end gap-1">
                    {insurance.map((p) => (
                      <span key={p.id}>
                        {p.provider_name}
                        {p.coverage_amount ? ` ${formatMoney(p.coverage_amount)}` : ''}{' '}
                        <span
                          className={`ml-1 rounded px-1.5 py-px text-[10px] font-semibold ${
                            p.status === 'approved'
                              ? 'bg-teal-50 text-teal-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {p.status === 'approved' ? 'Verified' : 'Not verified'}
                        </span>
                      </span>
                    ))}
                    {insurance.some((p) => p.status !== 'approved') && (
                      <Link
                        href="/dashboard/carrier/settings"
                        className="text-xs font-semibold text-teal-700 hover:underline"
                      >
                        Verify now
                      </Link>
                    )}
                  </span>
                ) : (
                  <Link
                    href="/dashboard/carrier/settings"
                    className="text-xs font-semibold text-teal-700 hover:underline"
                  >
                    Add insurance
                  </Link>
                )
              }
            />
            <Row
              label="Expires"
              value={
                quote.expires_at ? (
                  <span className={expired ? 'font-semibold text-red-600' : ''}>
                    {expired ? 'Expired ' : ''}
                    {fmtStamp(quote.expires_at)}
                  </span>
                ) : (
                  'Never'
                )
              }
            />
            <Row label="Quoted" value={fmtStamp(quote.created_at)} />
            {quote.updated_at && <Row label="Edited" value={fmtStamp(quote.updated_at)} />}
          </dl>
        </div>

        {/* Right: price + amend */}
        <aside className="sm:pt-1">
          <div className="rounded-xl border border-gray-200 p-4 sm:sticky sm:top-20">
            <p className="text-3xl font-bold text-gray-900">{formatMoney(quote.price)}</p>
            <p className="mt-1 text-xs leading-snug text-gray-500">
              final price · no hidden costs
              {priceChanged && (
                <>
                  <br />
                  previously{' '}
                  <span className="line-through">{formatMoney(quote.previous_price)}</span>
                </>
              )}
            </p>

            <div className="mt-4">
              {canAmend ? (
                <AmendQuoteMenu
                  quote={quote}
                  lowestOther={lowestOther}
                  defaults={{
                    timeframes: carrier?.payment_timeframes ?? [],
                    methods: carrier?.payment_methods ?? [],
                  }}
                />
              ) : (
                <p className="rounded-lg bg-gray-50 px-3 py-2 text-center text-xs font-medium text-gray-500">
                  {quote.status === 'accepted' ? '✓ Accepted by customer' : 'Quote locked'}
                </p>
              )}
            </div>

            {canAmend && lowestOther != null && Number(quote.price) > lowestOther && (
              <p className="mt-3 text-xs text-red-600">
                {formatMoney(Number(quote.price) - lowestOther)} above the lowest bid.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="text-right text-gray-800">{value}</dd>
    </div>
  )
}
