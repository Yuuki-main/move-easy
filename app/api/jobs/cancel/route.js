import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { jobId } = await req.json()

  const { error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .eq('status', 'open')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
