import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service-role'
import { sendEmail } from '@/lib/email'
import { carrierApproved } from '@/lib/email-templates'
import { loadChecklist } from '@/lib/carrier-profile'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { carrierId } = await req.json()

    const supabase = createServiceClient()

    // Fetch carrier profile (email lives in auth.users, not carrier_profiles)
    const { data: carrier } = await supabase
      .from('carrier_profiles')
      .select('id, public_name')
      .eq('id', carrierId)
      .single()

    if (!carrier) {
      return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })
    }

    // Get email from auth
    let email = null
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(carrierId)
      email = authUser?.user?.email || null
    } catch (_) {
      // auth.admin may not be available
    }

    // Update status
    const { error } = await supabase
      .from('carrier_profiles')
      .update({ application_status: 'active' })
      .eq('id', carrierId)

    if (error) {
      return serverError('admin/carriers/grant-access', error)
    }

    // Send email notification
    if (email) {
      try {
        await sendEmail({
          to: email,
          ...carrierApproved({
            name: carrier.public_name,
            missingSteps: (await loadChecklist(carrierId)).missing.map((i) => i.label),
          }),
        })
      } catch (emailErr) {
        console.error('[grant-access] Email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError('admin/carriers/grant-access', err)
  }
}
