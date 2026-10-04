import { createClient } from '@/lib/supabase/server'
import QuoteForm from './QuoteForm'
import ChatPanel from '@/components/ChatPanel'
import BookingActions from '@/components/BookingActions'
import ProfileChecklist from '@/components/ProfileChecklist'
import { loadChecklist } from '@/lib/carrier-profile'
import JobBids from './JobBids'
import MyQuotePreview from './MyQuotePreview'
import { loadJobCompetition } from '@/lib/carrier-quotes'
import { formatJobMoveWindow, jobTitle } from '@/lib/quotes'

const mask = (value) => (value ? '••••••••' : '••••••••')
const maskPhone = (phone) =>
  phone ? phone.slice(0, 2) + '••••••' + phone.slice(-2) : '+64 ••••••••••'

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

  // Fetch carrier wallet balance + status
  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('wallet_balance, application_status')
    .eq('id', user.id)
    .single()

  const checklist = await loadChecklist(user.id)

  // Pending/rejected carriers cannot quote — show gate instead
  if (carrier?.application_status !== 'active') {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-6">⏳</div>
        <h1 className="text-2xl font-bold mb-3">
          {carrier?.application_status === 'pending'
            ? 'Application under review'
            : 'Account not active'}
        </h1>
        <p className="text-gray-500">
          {carrier?.application_status === 'pending'
            ? "Your carrier application is pending approval. You'll be able to quote on jobs once an admin reviews and approves your profile. This typically takes less than 24 hours."
            : 'Your carrier account is not currently active. Please contact support if you believe this is an error.'}
        </p>
        {carrier?.application_status === 'pending' && (
          <div className="mt-8 text-left">
            <ProfileChecklist
              checklist={checklist}
              title="Meanwhile, complete your profile"
              intro="You'll need all of these before you can quote on jobs."
            />
          </div>
        )}
      </div>
    )
  }

  const walletBalance = carrier?.wallet_balance ?? 0

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
    .maybeSingle()

  // A withdrawn quote counts as "not quoted" — the carrier can quote again.
  const liveQuote = existingQuote?.status === 'withdrawn' ? null : existingQuote

  // Fetch conversation — available as soon as this carrier has quoted
  let conversationId = null
  if (existingQuote) {
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('job_id', id)
      .eq('carrier_id', user.id)
      .maybeSingle()
    conversationId = conv?.id ?? null
  }

  if (!job) {
    return <p className="text-center py-20 text-gray-400">Job not found.</p>
  }

  const photos = job.job_photos || []

  // Bids board + "my quote" preview, once this carrier has a live quote
  let competition = null
  let preview = null
  let myBooking = null
  if (liveQuote) {
    // This carrier's latest booking on the job, if their quote was ever accepted
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, status, completed_at, cancelled_at, cancelled_by, cancellation_reason')
      .eq('job_id', id)
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    myBooking = booking

    competition = (await loadJobCompetition([id], user.id))[id]
    const [{ data: profile }, { count: jobsCompleted }, { data: insurance }] =
      await Promise.all([
        supabase.from('carrier_profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('carrier_id', user.id)
          .eq('status', 'completed'),
        supabase
          .from('carrier_insurance')
          .select('id, provider_name, coverage_amount, status')
          .eq('carrier_id', user.id),
      ])
    const others = competition.bids.filter((b) => !b.isMine).map((b) => b.price)
    preview = {
      carrier: profile,
      jobsCompleted: jobsCompleted ?? 0,
      insurance: insurance ?? [],
      lowestOther: others.length ? Math.min(...others) : null,
      canAmend:
        liveQuote.status === 'pending' && ['open', 'quoted'].includes(job.status),
    }
  }

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
    <div className="max-w-3xl">
      <h1 className="mb-4 text-xl font-bold text-gray-900">{jobTitle(job)}</h1>

      {myBooking && <BookingCard booking={myBooking} />}

      {liveQuote && competition && (
        <JobBids title="Quotes on this job" bids={competition.bids}>
          <MyQuotePreview quote={liveQuote} job={job} {...preview} />
        </JobBids>
      )}

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
                {getShortAddress(job.pickup_address)}
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
                {getShortAddress(job.delivery_address)}
              </p>
            </div>
          </div>
        </div>

        {/* Move date */}
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Move Date
          </p>

          <p className="text-sm text-gray-700">{formatJobMoveWindow(job)}</p>
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

      {['open', 'quoted'].includes(job.status) && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-800 flex items-center gap-2">
          🔒 Customer contact details will be revealed once your quote is
          accepted.
        </div>
      )}

      {['booked', 'completed'].includes(job.status) && liveQuote?.status !== 'accepted' ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
          This job has already been booked with another carrier.
        </div>
      ) : ['open', 'quoted'].includes(job.status) && !liveQuote ? (
        <>
          {existingQuote?.status === 'withdrawn' && (
            <p className="mb-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              You withdrew your {`$${existingQuote.price}`} quote. Submit a new one below
              if you&apos;d still like this job.
            </p>
          )}
          {checklist.complete ? (
            <QuoteForm
              jobId={job.id}
              existingQuote={null}
              walletBalance={walletBalance}
            />
          ) : (
            <ProfileChecklist
              checklist={checklist}
              title="Complete your profile to quote on this job"
            />
          )}
        </>
      ) : null}

      {conversationId && (
        <div className="mt-6">
          <ChatPanel
            conversationId={conversationId}
            currentUserId={user.id}
          />
        </div>
      )}
    </div>
  )
}

const fmtDay = (d) =>
  new Date(d).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })

// The carrier's own booking on this job: actions while confirmed, outcome after.
function BookingCard({ booking }) {
  if (booking.status === 'confirmed') {
    return (
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">You&apos;re booked for this job</p>
        <p className="mt-0.5 mb-3 text-xs text-green-700">
          Mark it complete once the move is done — the customer will then be asked for a review.
        </p>
        <BookingActions bookingId={booking.id} role="carrier" />
      </div>
    )
  }
  if (booking.status === 'completed') {
    return (
      <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
        <p className="font-semibold">✓ Job completed</p>
        {booking.completed_at && (
          <p className="mt-0.5 text-xs text-teal-700">Marked complete on {fmtDay(booking.completed_at)}</p>
        )}
      </div>
    )
  }
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
      <p className="font-semibold">
        Booking cancelled
        {booking.cancelled_by === 'customer'
          ? ' by the customer'
          : booking.cancelled_by === 'admin'
            ? ' by Moving Easy support'
            : ' by you'}
        {booking.cancelled_at && ` on ${fmtDay(booking.cancelled_at)}`}
      </p>
      {booking.cancellation_reason && (
        <p className="mt-0.5 text-xs text-gray-500">Reason: {booking.cancellation_reason}</p>
      )}
    </div>
  )
}
