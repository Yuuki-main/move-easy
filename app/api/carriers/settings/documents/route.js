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
    const document_type = formData.get('document_type') ?? 'other'

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const { key, url } = await uploadToS3({
      buffer,
      fileName: file.name,
      mimeType: file.type,
      folder: 'carrier-documents',
    })

    const { data, error } = await supabase
      .from('carrier_documents')
      .insert({
        carrier_id: user.id,
        document_type,
        file_url: url,
        file_key: key,
        status: 'pending',
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  } catch (err) {
    console.error('[documents:POST]', err)
    return NextResponse.json(
      { error: err.message || 'Upload failed' },
      { status: 500 },
    )
  }
}
