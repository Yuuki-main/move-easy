import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { profileReminder } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { loadChecklist } from '@/lib/carrier-profile'
import { serverError } from '@/lib/api-errors'

// POST /api/admin/carriers/remind { carrierId } — email the carrier exactly
// which profile steps they still need before they can quote.
export async function POST(req) {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token || !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { carrierId } = await req.json().catch(() => ({}))
  const { data: carrier } = await supabaseAdmin
    .from('carrier_profiles')
    .select('id, public_name')
    .eq('id', carrierId)
    .maybeSingle()
  if (!carrier) return NextResponse.json({ error: 'Carrier not found' }, { status: 404 })

  const checklist = await loadChecklist(carrier.id)
  if (checklist.complete) {
    return NextResponse.json({ error: 'This profile is already complete' }, { status: 409 })
  }

  const contact = await getUserContact(carrier.id)
  if (!contact) return NextResponse.json({ error: 'Carrier has no email address' }, { status: 409 })

  try {
    await sendEmail({
      to: contact.email,
      ...profileReminder({
        name: carrier.public_name || contact.firstName,
        missingSteps: checklist.missing.map((i) => i.label),
      }),
    })
  } catch (err) {
    return serverError('admin/carriers/remind', err, 'The email could not be sent')
  }

  return NextResponse.json({ success: true, sentTo: contact.email })
}
