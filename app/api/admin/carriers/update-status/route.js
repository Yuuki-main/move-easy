import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service-role'
import { trySendEmail } from '@/lib/email'
import { carrierApproved, carrierRejected } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { loadChecklist } from '@/lib/carrier-profile'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { carrierId, status } = await req.json()

    if (!['active', 'rejected', 'pending'].includes(status))
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

    const supabase = createServiceClient()

    const { data: before } = await supabase
      .from('carrier_profiles')
      .select('public_name, application_status')
      .eq('id', carrierId)
      .single()

    if (!before) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })

    const { error } = await supabase
      .from('carrier_profiles')
      .update({ application_status: status })
      .eq('id', carrierId)

    if (error) return serverError('admin/carriers/update-status', error)

    // Email only on an actual change into approved / rejected
    if (before.application_status !== status && status !== 'pending') {
      const contact = await getUserContact(carrierId)
      if (contact) {
        const name = before.public_name || contact.firstName
        await trySendEmail(
          {
            to: contact.email,
            ...(status === 'active'
              ? carrierApproved({
                  name,
                  missingSteps: (await loadChecklist(carrierId)).missing.map((i) => i.label),
                })
              : carrierRejected({ name })),
          },
          'admin/update-status',
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return serverError('admin/carriers/update-status', err)
  }
}
