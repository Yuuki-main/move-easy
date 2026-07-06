import { createClient } from '@/lib/supabase/server'

export async function getActiveCarrier() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return { user: null, carrier: null }
  const user = session.user
  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return { user, carrier, supabase }
}
