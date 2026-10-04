import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { actorFor, cancelBooking } from '@/lib/bookings'

// POST /api/bookings/:id/cancel { reason, reopen }
// reopen: (customer only) put the job back on the market to pick another mover.
// A carrier cancelling always reopens the job for the customer.
export async function POST(req, { params }) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { reason, reopen } = await req.json().catch(() => ({}))
  if (!String(reason ?? '').trim()) {
    return NextResponse.json({ error: 'Please give a reason for cancelling' }, { status: 400 })
  }

  const actor = await actorFor(id, user.id)
  if (!actor) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  return cancelBooking({ bookingId: id, userId: user.id, actor, reason, reopen })
}
