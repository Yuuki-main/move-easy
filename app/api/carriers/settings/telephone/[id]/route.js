import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(req, { params }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { id } = await params

  // Check if this is the last mobile — if so, block deletion
  const { data: targets } = await supabase
    .from('carrier_telephones')
    .select('id, type')
    .eq('carrier_id', user.id)

  const allNumbers = targets ?? []
  const targetToDelete = allNumbers.find((t) => t.id === id)

  if (targetToDelete?.type === 'mobile') {
    const otherMobiles = allNumbers.filter(
      (t) => t.id !== id && t.type === 'mobile',
    )
    if (otherMobiles.length === 0) {
      return NextResponse.json(
        { error: 'You must keep at least one mobile number on your account' },
        { status: 400 },
      )
    }
  }

  const { error } = await supabase
    .from('carrier_telephones')
    .delete()
    .eq('id', id)
    .eq('carrier_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
