import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { cancelBooking, completeBooking } from '@/lib/bookings'

// POST /api/admin/bookings/:id { action: 'complete' | 'cancel', reason, reopen }
export async function POST(req, { params }) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const { action, reason, reopen } = await req.json().catch(() => ({}))

  if (action === 'complete') return completeBooking({ bookingId: id, actor: 'admin' })
  if (action === 'cancel') {
    if (!String(reason ?? '').trim()) {
      return NextResponse.json({ error: 'Please give a reason for cancelling' }, { status: 400 })
    }
    return cancelBooking({ bookingId: id, actor: 'admin', reason, reopen })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
