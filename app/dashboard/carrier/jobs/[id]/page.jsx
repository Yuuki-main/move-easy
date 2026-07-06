import { createClient } from '@/lib/supabase/server'
import QuoteForm from './QuoteForm'
import MessageThread from '@/components/MessageThread'

const mask = (value) => (value ? '••••••••' : '••••••••')
const maskPhone = (phone) =>
  phone ? phone.slice(0, 2) + '••••••' + phone.slice(-2) : '+91 ••••••••••'

export default async function CarrierJobDetailPage({ params }) {
  const supabase = await createClient()
  const { id } = await params

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Optional auth protection
  if (!session) {
    return (
      <p className="text-center py-20 text-gray-400">
        Please login to view this page.
      </p>
    )
  }

  const user = session.user

  const { data: job } = await supabase
    .from('jobs')
    .select(
      `
      *,
      job_items(*),
      job_photos(*)
    `,
    )
    .eq('id', id)
    .single()

  // Check if carrier already quoted
  const { data: existingQuote } = await supabase
    .from('quotes')
    .select('*')
    .eq('job_id', id)
    .eq('carrier_id', user.id)
    .single()

  if (!job) {
    return <p className="text-center py-20 text-gray-400">Job not found.</p>
  }

  const photos = job.job_photos || []

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <span className="inline-block bg-teal-50 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full mb-4 capitalize">
          {job.type.replace('_', ' ')}
        </span>

        {/* Addresses */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
              A
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Pickup</p>

              <p className="text-sm font-medium text-gray-800">
                {job.pickup_address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
              B
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Delivery</p>

              <p className="text-sm font-medium text-gray-800">
                {job.delivery_address}
              </p>
            </div>
          </div>
        </div>

        {/* Move date */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Move Date
          </p>

          <p className="text-sm text-gray-700">
            {job.move_date
              ? new Date(job.move_date).toLocaleDateString()
              : 'Flexible'}
          </p>
        </div>

        {/* Items */}
        {job.job_items?.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
              Items
            </p>

            <div className="space-y-2">
              {job.job_items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="text-gray-400">{item.quantity}x</span>

                  <span>{item.name}</span>

                  {item.weight_kg && (
                    <span className="text-gray-400">· {item.weight_kg} kg</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {photos.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              Photos
            </p>

            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo) => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt="Job"
                  className="w-full aspect-square object-cover rounded-lg border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Notes
            </p>

            <p className="text-sm text-gray-600 leading-relaxed">
              {job.description}
            </p>
          </div>
        )}
      </div>

      {job.status !== 'booked' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800 flex items-center gap-2">
          🔒 Customer contact details will be revealed once your quote is
          accepted.
        </div>
      )}

      <QuoteForm jobId={job.id} existingQuote={existingQuote} />

      {existingQuote?.status === 'accepted' && (
        <div className="mt-6">
          <MessageThread
            jobId={job.id}
            currentUserId={user.id}
            receiverId={job.customer_id}
          />
        </div>
      )}
    </div>
  )
}
