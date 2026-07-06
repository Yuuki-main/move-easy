import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { jobId, receiverId, body } = await req.json()
  if (!body?.trim())
    return NextResponse.json({ error: 'Message empty' }, { status: 400 })

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      job_id: jobId,
      sender_id: user.id,
      receiver_id: receiverId,
      body: body.trim(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message })
}
