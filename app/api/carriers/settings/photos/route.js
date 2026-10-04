export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3, UploadError } from '@/lib/uploadToS3'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { key, url } = await uploadToS3({ buffer, folder: 'carrier-photos' })

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

    if (error) return serverError('carriers/settings/photos', error)
    return NextResponse.json({ data: { url, key } })
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[photos:POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
