import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req, { params }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*')
    .eq('job_id', params.jobId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages })
}
