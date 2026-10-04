import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trySendEmail } from '@/lib/email'
import {
  carrierApplicationForAdmin,
  carrierApplicationReceived,
} from '@/lib/email-templates'

// Only a just-submitted application triggers emails, so calling this again
// later (or repeatedly) can't spam the applicant or the admin.
const FRESH_MS = 15 * 60 * 1000

// POST /api/carriers/registered — called by the sign-up page once the
// carrier profile has been saved.
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('id, public_name, legal_company_name, application_status, submitted_at, created_at')
    .eq('id', user.id)
    .maybeSingle()

  const submittedAt = new Date(carrier?.submitted_at ?? carrier?.created_at ?? 0).getTime()
  if (
    !carrier ||
    carrier.application_status !== 'pending' ||
    Date.now() - submittedAt > FRESH_MS
  ) {
    return NextResponse.json({ sent: false })
  }

  await Promise.all([
    user.email &&
      trySendEmail(
        { to: user.email, ...carrierApplicationReceived({ name: carrier.public_name }) },
        'carriers/registered',
      ),
    process.env.ADMIN_EMAIL &&
      trySendEmail(
        {
          to: process.env.ADMIN_EMAIL,
          ...carrierApplicationForAdmin({
            name: carrier.public_name,
            company: carrier.legal_company_name,
            email: user.email,
            carrierId: carrier.id,
          }),
        },
        'carriers/registered',
      ),
  ])

  return NextResponse.json({ sent: true })
}
