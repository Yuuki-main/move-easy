import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await resend.emails.send({
    from: 'Moving Easy <support@movingeasy.co.nz>',
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
