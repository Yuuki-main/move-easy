import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Moving Easy <info@movingeasy.co.nz>'

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  })

  if (error) {
    console.error('[sendEmail] Resend rejected the request:', error)
    throw new Error(error.message)
  }

  return data
}

// Many recipients, each getting their own email. Resend's batch endpoint
// takes up to 100 messages per call and avoids per-second rate limits.
export async function sendEmailBatch(messages) {
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100).map((m) => ({ from: FROM, ...m }))
    const { error } = await resend.batch.send(chunk)
    if (error) {
      console.error('[sendEmailBatch] Resend rejected a batch:', error)
      throw new Error(error.message)
    }
  }
}

// Fire-and-log: an email failure must never fail the request that caused it.
export async function trySendEmail(message, tag) {
  try {
    await sendEmail(message)
  } catch (err) {
    console.error(`[${tag}] Email failed:`, err.message)
  }
}
