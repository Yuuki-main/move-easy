import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { bookingIds } = await req.json()
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    return NextResponse.json({ error: 'bookingIds required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ viewed_by_carrier: true })
    .eq('carrier_id', user.id)
    .in('id', bookingIds)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
