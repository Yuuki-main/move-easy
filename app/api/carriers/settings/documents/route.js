export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3, UploadError } from '@/lib/uploadToS3'
import { serverError } from '@/lib/api-errors'

const DOCUMENT_TYPES = ['proof_of_address', 'driving_license', 'identity', 'other']

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

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!DOCUMENT_TYPES.includes(document_type)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    // ID / insurance documents are private: no public URL, served via /api/files
    const { key, url } = await uploadToS3({
      buffer,
      folder: `carrier-documents/${user.id}`,
      allowPdf: true,
      isPrivate: true,
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

    if (error) return serverError('carriers/settings/documents', error)
    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('[documents:POST]', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
