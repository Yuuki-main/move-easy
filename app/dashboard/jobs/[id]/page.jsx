import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Calendar, Users } from 'lucide-react'
import MessageThread from '@/components/MessageThread'
import ReviewForm from '@/components/ReviewForm'
import QuotesSection from './QuotesSection'
import CancelJobButton from './CancelJobButton'
import ShipmentMap from '@/components/shipment/ShipmentMap'

export default async function CustomerJobDetailPage({ params }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: job } = await supabase
    .from('jobs')
    .select('*, job_items(*), job_photos(*)')
    .eq('id', id)
    .eq('customer_id', user.id)
    .single()

  console.log('job', { job })

  if (!job)
    return <p className="text-center py-20 text-gray-400">Job not found.</p>

  // Fetch quotes sorted by price
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, carrier_profiles(public_name, profile_description, phone)')
    .eq('job_id', id)
    .order('price', { ascending: true })

  // Enrich each quote with full carrier profile + most recent review
  const enrichedQuotes = await Promise.all(
    (quotes ?? []).map(async (quote) => {
      const { data: carrier } = await supabase
        .from('carrier_profiles')
        .select('*')
        .eq('id', quote.carrier_id)
        .single()

      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('carrier_id', quote.carrier_id)
        .order('created_at', { ascending: false })
        .limit(1)

      return { ...quote, carrier, recentReview: reviews?.[0] ?? null }
    }),
  )

  const acceptedQuote = enrichedQuotes.find((q) => q.status === 'accepted')

  // Fetch booking (if job has been booked)
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('job_id', job.id)
    .maybeSingle()

  // Check if a review already exists for this booking
  const { data: existingReview } = booking
    ? await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', booking.id)
        .maybeSingle()
    : { data: null }

  // Fetch carrier contact when booked
  const { data: carrierContact } =
    job.status === 'booked' && booking
      ? await supabase
          .from('carrier_profiles')
          .select('public_name, phone, city')
          .eq('id', booking.carrier_id)
          .single()
      : { data: null }

  const jobTypeLabel = job.type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

  const requestId = job.id.slice(0, 6).toUpperCase()

  const collectionDateDisplay = (() => {
    switch (job.move_date_type) {
      case 'flexible': return 'Flexible'
      case 'asap': return 'ASAP'
      case 'specific':
        return job.move_date_from
          ? new Date(job.move_date_from).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'Not set'
      case 'between':
        return job.move_date_from
          ? new Date(job.move_date_from).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
          : 'Not set'
      default: return 'Flexible'
    }
  })()

  const deliveryDateDisplay = job.move_date_to
    ? new Date(job.move_date_to).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

  return (
    <div className="max-w-3xl mx-auto px-4 pb-10 pt-8">
      {/* Job title */}
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{jobTypeLabel}</h1>
      <p className="text-sm text-gray-400 mb-6">
        {job.pickup_address?.split(',')[0]} →{' '}
        {job.delivery_address?.split(',')[0]}
      </p>

      {/* Job summary */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 capitalize">
          {job.type.replace(/_/g, ' ')}
        </span>
        <p className="text-sm font-medium">
          {job.pickup_address} → {job.delivery_address}
        </p>
        <p className="text-xs text-gray-400 mt-1 capitalize">
          Status: {job.status}
        </p>
      </div>

      {/* Revealed carrier contact — only when booked */}
      {job.status === 'booked' && carrierContact && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
          <p className="font-semibold text-green-800 mb-3">
            ✅ Booking confirmed — contact details revealed
          </p>
          <div className="space-y-1 text-sm text-green-700">
            <p>
              Carrier: <strong>{carrierContact.public_name}</strong>
            </p>
            <p>
              Phone: <strong>{carrierContact.phone ?? 'Not provided'}</strong>
            </p>
            <p>
              City: <strong>{carrierContact.city}</strong>
            </p>
          </div>
          <p className="text-xs text-green-500 mt-3">
            You can now contact your carrier directly to arrange collection.
          </p>
        </div>
      )}

      {/* Quotes */}
      <h2 className="font-bold text-lg mb-3">
        Quotes received ({enrichedQuotes.length})
      </h2>

      <QuotesSection quotes={enrichedQuotes} job={job} userId={user.id} />

      {/* ─────────────────────────────────────── */}
      {/* My delivery details                     */}
      {/* ─────────────────────────────────────── */}

      <div className="mt-10 mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1 capitalize">
          {job.type?.replace(/_/g, ' ')}
        </p>
        <h2 className="text-3xl font-black text-gray-900">
          My delivery details
        </h2>
      </div>

      {/* Map + Collection / Delivery grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Map */}
        <ShipmentMap
          pickupAddress={job.pickup_address}
          pickupLat={job.pickup_lat}
          pickupLng={job.pickup_lng}
          deliveryAddress={job.delivery_address}
          deliveryLat={job.delivery_lat}
          deliveryLng={job.delivery_lng}
          interactive={false}
          height="320px"
        />

        {/* Collection + Delivery details */}
        <div className="space-y-8">
          {/* Collection */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Collection</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">{job.pickup_address}</p>
                  {job.pickup_floor && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      • {job.pickup_floor}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {job.move_date_type === 'between' ? 'Collection date' : 'Move date'}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {collectionDateDisplay}
                  </p>
                </div>
              </div>
              {job.item_loading && (
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Loading
                    </p>
                    <p className="text-sm text-gray-600">{job.item_loading}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Delivery */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Delivery</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Address</p>
                  <p className="text-sm text-gray-600">
                    {job.delivery_address}
                  </p>
                  {job.delivery_floor && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      • {job.delivery_floor}
                    </p>
                  )}
                </div>
              </div>
              {deliveryDateDisplay && (
                <div className="flex items-start gap-3">
                  <Calendar size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Delivery date
                    </p>
                    <p className="text-sm text-gray-600 capitalize">
                      {deliveryDateDisplay}
                    </p>
                  </div>
                </div>
              )}
              {job.item_unloading && (
                <div className="flex items-start gap-3">
                  <Users size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      Unloading
                    </p>
                    <p className="text-sm text-gray-600">
                      {job.item_unloading}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items list */}
      {job.job_items?.length > 0 && (
        <div className="mb-6">
          {job.job_items.map((item) => (
            <div key={item.id} className="border-t border-gray-100 py-5">
              <h3 className="font-bold text-gray-900 capitalize mb-1">
                {item.name}
              </h3>
              {job.description && (
                <p className="text-sm text-gray-500 mb-3">{job.description}</p>
              )}
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex flex-wrap gap-6 text-sm text-gray-500">
                <span>
                  Weight {item.weight_kg ? `${item.weight_kg}kg` : '—'}
                </span>
                <span>
                  Length {item.length_cm ? `${item.length_cm}cm` : '—'}
                </span>
                <span>Width {item.width_cm ? `${item.width_cm}cm` : '—'}</span>
                <span>
                  Height {item.height_cm ? `${item.height_cm}cm` : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photos */}
      {!job.job_photos?.length ? (
        <div className="border-t border-gray-100 py-6 mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Do you have photos? Adding them may reduce quote prices.
          </p>
          <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Add photos
          </button>
        </div>
      ) : (
        <div className="border-t border-gray-100 py-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Photos</h3>
          <div className="grid grid-cols-5 gap-2">
            {job.job_photos.slice(0, 4).map((photo, i) => (
              <img
                key={photo.id}
                src={photo.url}
                alt={`Job photo ${i + 1}`}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
            {job.job_photos.length > 4 && (
              <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                +{job.job_photos.length - 4}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request ID + actions */}
      <div className="border-t border-gray-100 py-8 mb-10">
        <h3 className="font-bold text-gray-900 mb-1">
          Request ID #{requestId}
        </h3>
        <p className="text-xs text-gray-400 mb-5">
          Posted on{' '}
          {new Date(job.created_at).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
        <div className="flex flex-col gap-3 max-w-xs">
          <Link
            href="/get-prices"
            className="bg-gray-900 text-white text-sm font-semibold px-5 py-2.5 rounded-lg text-center hover:bg-gray-700 transition-colors"
          >
            Create new request
          </Link>
          {job.status === 'open' && <CancelJobButton jobId={job.id} />}
        </div>
      </div>

      {/* Message thread — only shown after a quote is accepted */}
      {acceptedQuote && (
        <div className="mt-6">
          <MessageThread
            jobId={job.id}
            currentUserId={user.id}
            receiverId={acceptedQuote.carrier_id}
          />
        </div>
      )}

      {/* Review form — only when booking confirmed and no review yet */}
      {booking?.status === 'confirmed' && !existingReview && (
        <div className="mt-6">
          <ReviewForm
            bookingId={booking.id}
            jobId={job.id}
            carrierId={booking.carrier_id}
          />
        </div>
      )}
    </div>
  )
}
