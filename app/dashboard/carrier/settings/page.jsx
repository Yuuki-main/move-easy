import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from './SettingsTabs'

export default async function CarrierSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, date_of_birth, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'carrier') redirect('/dashboard')

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch related data in parallel
  const [
    { data: telephones },
    { data: documents },
    { data: insurance },
    { data: notifications },
  ] = await Promise.all([
    supabase
      .from('carrier_telephones')
      .select('*')
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('carrier_documents')
      .select('*')
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('carrier_insurance')
      .select('*')
      .eq('carrier_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('carrier_notification_preferences')
      .select('*')
      .eq('carrier_id', user.id)
      .single(),
  ])

  return (
    <SettingsTabs
      carrier={carrier}
      profile={profile}
      userEmail={user.email}
      telephones={telephones ?? []}
      documents={documents ?? []}
      insurance={insurance ?? []}
      notifications={notifications}
    />
  )
}
