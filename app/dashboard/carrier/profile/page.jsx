import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CarrierProfileForm from './CarrierProfileForm'

export default async function CarrierProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-2">My Profile</h1>
      <p className="text-sm text-gray-400 mb-8">
        Update your public profile to attract more customers.
      </p>
      <CarrierProfileForm carrier={carrier} />
    </div>
  )
}
