import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const { fromIndex, toIndex } = body

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('photos')
    .eq('id', user.id)
    .single()

  const photos = [...(carrier?.photos ?? [])]
  if (fromIndex < 0 || fromIndex >= photos.length) {
    return NextResponse.json({ error: 'Invalid fromIndex' }, { status: 400 })
  }
  if (toIndex < 0 || toIndex >= photos.length) {
    return NextResponse.json({ error: 'Invalid toIndex' }, { status: 400 })
  }

  const [moved] = photos.splice(fromIndex, 1)
  photos.splice(toIndex, 0, moved)

  const { error } = await supabase
    .from('carrier_profiles')
    .update({ photos })
    .eq('id', user.id)

  if (error) return serverError('carriers/settings/photos/reorder', error)
  return NextResponse.json({ success: true })
}
