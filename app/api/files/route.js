export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { s3Client, BUCKET_NAME } from '@/lib/s3'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Only verification files are served here; photos stay on public URLs.
const PRIVATE_PREFIXES = ['private/', 'carrier-documents/']

async function canView(key) {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(COOKIE_NAME)?.value
  if (adminToken && verifyAdminToken(adminToken)) return true

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  // The carrier who uploaded it (as a document or an insurance proof)
  const [{ count: docs }, { count: policies }] = await Promise.all([
    supabaseAdmin
      .from('carrier_documents')
      .select('id', { count: 'exact', head: true })
      .eq('file_key', key)
      .eq('carrier_id', user.id),
    supabaseAdmin
      .from('carrier_insurance')
      .select('id', { count: 'exact', head: true })
      .eq('proof_key', key)
      .eq('carrier_id', user.id),
  ])
  return Boolean(docs || policies)
}

// GET /api/files?key=… — stream a private verification file to its owner or an admin
export async function GET(req) {
  const key = new URL(req.url).searchParams.get('key') ?? ''
  if (!PRIVATE_PREFIXES.some((p) => key.startsWith(p)) || key.includes('..')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!(await canView(key))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    const obj = await s3Client.send(new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
    return new Response(obj.Body.transformToWebStream(), {
      headers: {
        'Content-Type': obj.ContentType || 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
      },
    })
  } catch (err) {
    if (err.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[files] S3 read failed:', err.name)
    return NextResponse.json({ error: 'Could not load file' }, { status: 500 })
  }
}
