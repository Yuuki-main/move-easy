import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service-role'

export async function POST(req) {
  // Re-check admin session server-side
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await req.json()

    if (!['approved', 'disapproved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Use SECURITY DEFINER RPC to bypass the insurance trigger
    const { error } = await supabase.rpc('admin_review_document', {
      p_document_id: id,
      p_status: status,
      p_reviewed_at: new Date().toISOString(),
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 },
    )
  }
}
