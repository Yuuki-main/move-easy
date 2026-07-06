import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GetPricesClient from './GetPricesClient'

export const metadata = {
  title: 'Get Prices | Moving Easy',
}

export default async function GetPricesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: carrierProfile } = await supabase
    .from('carrier_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (carrierProfile) redirect('/dashboard/carrier')

  return <GetPricesClient />
}
