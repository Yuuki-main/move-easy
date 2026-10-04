import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { sendEmailBatch, trySendEmail } from '@/lib/email'
import { jobCancelledForCarrier, jobCancelledForCustomer } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { notifyMany } from '@/lib/notifications'
import { serverError } from '@/lib/api-errors'

export async function POST(req) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { jobId } = await req.json().catch(() => ({}))

  // A job can be cancelled until a quote is accepted (open or quoted).
  const { data: job, error } = await supabase
    .from('jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .eq('customer_id', user.id)
    .in('status', ['open', 'quoted'])
    .select('id, type, pickup_address, delivery_address')
    .maybeSingle()

  if (error) return serverError('jobs/cancel', error)
  if (!job) {
    return NextResponse.json(
      { error: 'This request can no longer be cancelled' },
      { status: 409 },
    )
  }

  // Close out the live quotes and tell those carriers.
  const { data: closed } = await supabaseAdmin
    .from('quotes')
    .update({ status: 'rejected' })
    .eq('job_id', job.id)
    .eq('status', 'pending')
    .select('carrier_id, carrier_profiles(public_name)')

  await notifyMany(
    (closed ?? []).map((q) => q.carrier_id),
    {
      type: 'job_cancelled',
      title: 'A job you quoted on was cancelled',
      content: String(job.type ?? 'move').replace(/_/g, ' '),
      link: '/dashboard/carrier/quotes',
      jobId: job.id,
    },
  )

  try {
    const contacts = await Promise.all((closed ?? []).map((q) => getUserContact(q.carrier_id)))
    const messages = (closed ?? [])
      .map((q, i) =>
        contacts[i]
          ? {
              to: contacts[i].email,
              ...jobCancelledForCarrier({
                carrierName: q.carrier_profiles?.public_name || contacts[i].firstName,
                job,
              }),
            }
          : null,
      )
      .filter(Boolean)
    if (messages.length) await sendEmailBatch(messages)
  } catch (err) {
    console.error('[jobs/cancel] Carrier emails failed:', err.message)
  }

  if (user.email) {
    await trySendEmail(
      {
        to: user.email,
        ...jobCancelledForCustomer({
          customerName: user.user_metadata?.first_name || user.email.split('@')[0],
          job,
        }),
      },
      'jobs/cancel',
    )
  }

  return NextResponse.json({ success: true })
}
