export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/uploadToS3'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { key, url } = await uploadToS3({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      folder: 'carrier-photos',
    })

    // Get current photos array
    const { data: carrier } = await supabase
      .from('carrier_profiles')
      .select('photos')
      .eq('id', user.id)
      .single()

    const currentPhotos = carrier?.photos ?? []
    const updatedPhotos = [...currentPhotos, url]

    const { error } = await supabase
      .from('carrier_profiles')
      .update({ photos: updatedPhotos })
      .eq('id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { url, key } })
  } catch (err) {
    console.error('[photos:POST]', err)
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 },
    )
  }
}
