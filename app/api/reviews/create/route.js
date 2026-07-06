import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { bookingId, jobId, carrierId, rating, comment } = await req.json()

  if (!rating || rating < 1 || rating > 10)
    return NextResponse.json({ error: 'Rating must be 1-10' }, { status: 400 })

  // Prevent duplicate reviews
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'Already reviewed' }, { status: 409 })

  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      booking_id: bookingId,
      job_id: jobId,
      customer_id: user.id,
      carrier_id: carrierId,
      rating,
      comment,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate carrier's average rating
  const { data: allReviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('carrier_id', carrierId)

  const total = allReviews.length
  const avg = allReviews.reduce((sum, r) => sum + r.rating, 0) / total

  await supabase
    .from('carrier_profiles')
    .update({ total_reviews: total, average_rating: avg.toFixed(2) })
    .eq('id', carrierId)

  // Mark booking as completed
  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)

  return NextResponse.json({ review })
}
