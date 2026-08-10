import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service-role'
import { sendEmail } from '@/lib/email'

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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Send email notification
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: 'Your carrier account has been approved!',
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #16a34a;">✅ Account Approved</h2>
              <p>Hi ${carrier.public_name || 'there'},</p>
              <p>Your carrier application for <strong>Moving Easy</strong> has been approved!</p>
              <p>You can now log in and start accepting jobs:</p>
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/login"
                   style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Go to Dashboard
                </a>
              </p>
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                — The Moving Easy Team
              </p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.error('[grant-access] Email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Internal error' },
      { status: 500 },
    )
  }
}
