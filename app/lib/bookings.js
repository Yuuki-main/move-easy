import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { trySendEmail } from '@/lib/email'
import {
  bookingCancelled,
  bookingCompletedForCarrier,
  bookingCompletedForCustomer,
} from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { notify } from '@/lib/notifications'

// Errors raised by the complete_booking / cancel_booking SQL functions
const RPC_ERRORS = {
  BOOKING_NOT_FOUND: [404, 'Booking not found'],
  BOOKING_NOT_ACTIVE: [409, 'This booking is already completed or cancelled'],
}

function rpcFailure(tag, error) {
  const known = Object.keys(RPC_ERRORS).find((k) => error.message?.includes(k))
  if (known) {
    const [status, message] = RPC_ERRORS[known]
    return NextResponse.json({ error: message }, { status })
  }
  console.error(`[${tag}]`, error.message)
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}

// Which side of the booking is this user? null if neither.
export async function actorFor(bookingId, userId) {
  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('customer_id, carrier_id')
    .eq('id', bookingId)
    .maybeSingle()
  if (!booking) return null
  if (booking.carrier_id === userId) return 'carrier'
  if (booking.customer_id === userId) return 'customer'
  return null
}

async function loadParties(jobId, customerId, carrierId) {
  const [{ data: job }, { data: carrier }, customer, carrierContact] = await Promise.all([
    supabaseAdmin
      .from('jobs')
      .select('id, type, pickup_address, delivery_address')
      .eq('id', jobId)
      .single(),
    supabaseAdmin.from('carrier_profiles').select('public_name').eq('id', carrierId).single(),
    getUserContact(customerId),
    getUserContact(carrierId),
  ])
  return {
    job,
    carrierName: carrier?.public_name || carrierContact?.firstName || 'Your mover',
    customer,
    carrierContact,
  }
}

// Mark the work as done. Unlocks the customer's review.
export async function completeBooking({ bookingId, userId = null, actor }) {
  const { data, error } = await supabaseAdmin.rpc('complete_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
    p_actor: actor,
  })
  if (error) return rpcFailure('bookings/complete', error)

  const { job_id: jobId, customer_id: customerId, carrier_id: carrierId } = data[0]
  const { job, carrierName, customer, carrierContact } = await loadParties(jobId, customerId, carrierId)

  await Promise.all([
    // Customer: always asked for a review
    customer &&
      trySendEmail(
        { to: customer.email, ...bookingCompletedForCustomer({ customerName: customer.firstName, carrierName, job }) },
        'bookings/complete',
      ),
    notify(customerId, {
      type: 'booking_completed',
      title: 'Move complete — leave a review',
      content: `How was ${carrierName}?`,
      link: `/dashboard/jobs/${jobId}#review`,
      jobId,
    }),
    // Carrier: told when someone else marked it done
    actor !== 'carrier' &&
      carrierContact &&
      trySendEmail(
        { to: carrierContact.email, ...bookingCompletedForCarrier({ carrierName, job }) },
        'bookings/complete',
      ),
    actor !== 'carrier' &&
      notify(carrierId, {
        type: 'booking_completed',
        title: 'Job marked complete',
        content: job?.type?.replace(/_/g, ' '),
        link: '/dashboard/carrier/bookings',
        jobId,
      }),
  ])

  return NextResponse.json({ success: true })
}

// Cancel a confirmed booking. No money moves (the fee is not refunded).
export async function cancelBooking({ bookingId, userId = null, actor, reason, reopen }) {
  const { data, error } = await supabaseAdmin.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_user_id: userId,
    p_actor: actor,
    p_reason: String(reason ?? '').slice(0, 1000),
    p_reopen: Boolean(reopen),
  })
  if (error) return rpcFailure('bookings/cancel', error)

  const { job_id: jobId, customer_id: customerId, carrier_id: carrierId, reopened } = data[0]
  const { job, carrierName, customer, carrierContact } = await loadParties(jobId, customerId, carrierId)
  const cleanReason = String(reason ?? '').trim() || null

  const tellCustomer = actor !== 'customer'
  const tellCarrier = actor !== 'carrier'

  await Promise.all([
    tellCustomer &&
      customer &&
      trySendEmail(
        {
          to: customer.email,
          ...bookingCancelled({
            recipientName: customer.firstName,
            cancelledBy: actor,
            reason: cleanReason,
            reopened,
            job,
            forCarrier: false,
          }),
        },
        'bookings/cancel',
      ),
    tellCustomer &&
      notify(customerId, {
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        content: reopened ? 'Your request is open again — pick another quote' : cleanReason,
        link: `/dashboard/jobs/${jobId}`,
        jobId,
      }),
    tellCarrier &&
      carrierContact &&
      trySendEmail(
        {
          to: carrierContact.email,
          ...bookingCancelled({
            recipientName: carrierName,
            cancelledBy: actor,
            reason: cleanReason,
            reopened,
            job,
            forCarrier: true,
          }),
        },
        'bookings/cancel',
      ),
    tellCarrier &&
      notify(carrierId, {
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        content: cleanReason || job?.type?.replace(/_/g, ' '),
        link: '/dashboard/carrier/bookings',
        jobId,
      }),
  ])

  return NextResponse.json({ success: true, reopened })
}
