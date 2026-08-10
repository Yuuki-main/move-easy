import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE ?key=... — remove a photo by S3 key
export async function DELETE(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('photos')
    .eq('id', user.id)
    .single()

  const currentPhotos = carrier?.photos ?? []
  const updatedPhotos = currentPhotos.filter((url) => !url.includes(key))

  const { error } = await supabase
    .from('carrier_profiles')
    .update({ photos: updatedPhotos })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
