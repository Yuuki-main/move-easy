import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { serverError } from '@/lib/api-errors'
import { notify } from '@/lib/notifications'

// POST /api/reviews/create { bookingId, rating, comment }
// Only the booking's customer, only once the work is completed, only once.
// Everything else (job, carrier) is taken from the booking — never the client.
export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const rating = Number(body.rating)
  const comment = String(body.comment ?? '').trim().slice(0, 2000) || null

  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return NextResponse.json({ error: 'Rating must be between 1 and 10' }, { status: 400 })
  }

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('id, job_id, customer_id, carrier_id, status')
    .eq('id', body.bookingId)
    .maybeSingle()

  if (!booking || booking.customer_id !== user.id) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  if (booking.status !== 'completed') {
    return NextResponse.json(
      { error: 'You can leave a review once the move is marked complete' },
      { status: 409 },
    )
  }

  const { data: review, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      booking_id: booking.id,
      job_id: booking.job_id,
      customer_id: user.id,
      carrier_id: booking.carrier_id,
      rating,
      comment,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'You have already reviewed this move' }, { status: 409 })
    }
    return serverError('reviews/create', error)
  }

  // Recalculate the carrier's rating from all their reviews
  const { data: allReviews } = await supabaseAdmin
    .from('reviews')
    .select('rating')
    .eq('carrier_id', booking.carrier_id)

  const total = allReviews?.length ?? 0
  const avg = total ? allReviews.reduce((sum, r) => sum + r.rating, 0) / total : 0

  const { error: ratingError } = await supabaseAdmin
    .from('carrier_profiles')
    .update({ total_reviews: total, average_rating: Number(avg.toFixed(2)) })
    .eq('id', booking.carrier_id)
  if (ratingError) console.error('[reviews/create] rating update failed:', ratingError.message)

  await notify(booking.carrier_id, {
    type: 'new_review',
    title: `New review: ${rating}/10`,
    content: comment,
    link: `/carrier/${booking.carrier_id}`,
    jobId: booking.job_id,
  })

  return NextResponse.json({ review })
}
