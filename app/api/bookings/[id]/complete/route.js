import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { actorFor, completeBooking } from '@/lib/bookings'

// POST /api/bookings/:id/complete — the carrier or customer says the work is done
export async function POST(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const actor = await actorFor(id, user.id)
  if (!actor) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  return completeBooking({ bookingId: id, userId: user.id, actor })
}
