// Every transactional email the app sends. All user-supplied values pass
// through esc() so a name, address or message can never inject HTML/links.

const APP_URL = () => process.env.NEXT_PUBLIC_APP_URL || ''

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const money = (n) =>
  `$${Number(n).toLocaleString('en-NZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const niceDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-NZ', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null

const jobLabel = (type) => (type ? String(type).replace(/_/g, ' ') : 'move')

// Suburb + city only — street addresses are never emailed before a booking.
export function areaOnly(address) {
  if (!address) return ''
  const parts = String(address)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length >= 2 ? parts.slice(-2).join(', ') : parts[0]
}

// ── Building blocks ─────────────────────────────────────────────────────────

function layout({ heading, intro, body = '', cta, footer }) {
  return `
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
  <p style="font-size:13px;font-weight:700;color:#0d9488;margin:0 0 16px;letter-spacing:.02em">Moving Easy</p>
  <h2 style="color:#111827;font-size:22px;margin:0 0 8px">${heading}</h2>
  <p style="color:#4b5563;font-size:14px;margin:0 0 24px;line-height:1.55">${intro}</p>
  ${body}
  ${
    cta
      ? `<a href="${esc(cta.href)}" style="background:#0d9488;color:#ffffff;padding:13px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;margin-bottom:24px">${esc(cta.label)}</a>`
      : ''
  }
  <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;line-height:1.5">${
    footer ?? 'You received this email because you have an account on Moving Easy.'
  }</p>
</div>`
}

// rows: [[label, value, { strong, mono, color }], ...] — falsy values are skipped
function table(rows) {
  const tr = rows
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .map(([label, value, opt = {}]) => {
      const style = [
        'padding:6px 0',
        'text-align:right',
        `color:${opt.color ?? '#374151'}`,
        opt.strong ? 'font-weight:700' : '',
        opt.mono ? 'font-family:monospace;font-size:12px;color:#6b7280' : '',
      ]
        .filter(Boolean)
        .join(';')
      return `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">${esc(label)}</td><td style="${style}">${esc(value)}</td></tr>`
    })
    .join('')
  return `<div style="background:#f9fafb;border-radius:12px;padding:16px 20px;margin-bottom:24px"><table style="width:100%;border-collapse:collapse;font-size:14px">${tr}</table></div>`
}

function quoteBlock(text) {
  if (!text) return ''
  return `<div style="background:#f0fdfa;border-left:3px solid #0d9488;border-radius:4px;padding:12px 16px;margin-bottom:24px;font-size:14px;color:#134e4a;white-space:pre-wrap">${esc(text)}</div>`
}

const ref = (jobId) => `#${String(jobId).slice(0, 8)}`

// Steps a carrier needs before they can quote (labels from lib/carrier-profile)
const PROFILE_STEPS = [
  'Write a short business description',
  'Add a phone number',
  'Upload at least one photo of your truck or team',
  'Upload ID (driving licence or passport)',
  'Add your insurance policy',
]

function stepsList(steps) {
  const li = steps
    .map((s) => `<li style="margin:0 0 6px">${esc(s)}</li>`)
    .join('')
  return `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:16px 20px;margin-bottom:24px"><p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#92400e">To quote on jobs you need to:</p><ul style="margin:0;padding-left:18px;font-size:14px;color:#78350f;line-height:1.5">${li}</ul></div>`
}

// ── Customers ───────────────────────────────────────────────────────────────

export function newQuoteForCustomer({ customerName, carrierName, price, message, job }) {
  return {
    subject: "You've received a new quote for your move",
    html: layout({
      heading: 'New quote received',
      intro: `Hi ${esc(customerName)},<br/><strong>${esc(carrierName)}</strong> has quoted on your ${esc(jobLabel(job.type))}.`,
      body:
        table([
          ['Carrier', carrierName],
          ['Quoted price', money(price), { strong: true, color: '#059669' }],
          ['Pickup', job.pickup_address],
          ['Delivery', job.delivery_address],
          ['Move date', niceDate(job.move_date_from)],
          ['Job reference', ref(job.id), { mono: true }],
        ]) + quoteBlock(message),
      cta: { href: `${APP_URL()}/dashboard/jobs/${job.id}`, label: 'View quote →' },
    }),
  }
}

export function bookingConfirmedForCustomer({ customerName, carrierName, price, job }) {
  return {
    subject: `Booking confirmed with ${carrierName}`,
    html: layout({
      heading: 'Your move is booked',
      intro: `Hi ${esc(customerName)},<br/>You've accepted <strong>${esc(carrierName)}</strong>'s quote. They can now see your contact details and will be in touch to arrange the move.`,
      body: table([
        ['Carrier', carrierName],
        ['Agreed price', money(price), { strong: true, color: '#059669' }],
        ['Pickup', job.pickup_address],
        ['Delivery', job.delivery_address],
        ['Move date', niceDate(job.move_date_from)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/jobs/${job.id}`, label: 'View booking →' },
    }),
  }
}

export function jobCancelledForCustomer({ customerName, job }) {
  return {
    subject: 'Your move request has been cancelled',
    html: layout({
      heading: 'Request cancelled',
      intro: `Hi ${esc(customerName)},<br/>Your ${esc(jobLabel(job.type))} request has been cancelled and carriers can no longer quote on it.`,
      body: table([
        ['From', areaOnly(job.pickup_address)],
        ['To', areaOnly(job.delivery_address)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/get-prices`, label: 'Post a new request' },
    }),
  }
}

// ── Carriers ────────────────────────────────────────────────────────────────

export function newJobForCarrier({ carrierName, job, missingSteps = [], pending = false }) {
  const desc = job.description
    ? job.description.slice(0, 160) + (job.description.length > 160 ? '…' : '')
    : null
  return {
    subject: `New ${jobLabel(job.type)} request available`,
    html: layout({
      heading: 'New move request',
      intro: `Hi ${esc(carrierName || 'there')},<br/>A new <strong>${esc(jobLabel(job.type))}</strong> request was just posted on Moving Easy.`,
      body:
        table([
          ['From', areaOnly(job.pickup_address)],
          ['To', areaOnly(job.delivery_address)],
          ['Earliest date', niceDate(job.move_date_from)],
          ['Description', desc],
          ['Job reference', ref(job.id), { mono: true }],
        ]) +
        (pending
          ? `<p style="color:#92400e;font-size:14px;line-height:1.55;margin:0 0 16px">Your account is still being reviewed — you can quote once it's approved.</p>`
          : '') +
        (missingSteps.length ? stepsList(missingSteps) : ''),
      cta: missingSteps.length
        ? { href: `${APP_URL()}/dashboard/carrier`, label: 'Complete my profile →' }
        : { href: `${APP_URL()}/dashboard/carrier/jobs/${job.id}`, label: 'View & quote →' },
      footer:
        "You received this because you're a carrier on Moving Easy. You can turn these emails off in Settings → Notifications.",
    }),
  }
}

export function quoteAcceptedForCarrier({ carrierName, customerName, price, fee, job }) {
  return {
    subject: 'Your quote was accepted',
    html: layout({
      heading: 'Quote accepted 🎉',
      intro: `Hi ${esc(carrierName)},<br/><strong>${esc(customerName)}</strong> has accepted your quote for their ${esc(jobLabel(job.type))}.`,
      body: table([
        ['Customer', customerName],
        ['Accepted quote', money(price), { strong: true, color: '#059669' }],
        ['Platform fee', `-${money(fee)}`, { color: '#dc2626' }],
        ['Pickup', job.pickup_address],
        ['Delivery', job.delivery_address],
        ['Move date', niceDate(job.move_date_from)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/carrier/jobs/${job.id}`, label: 'View booking →' },
      footer: 'You can now message the customer and arrange the move.',
    }),
  }
}

export function jobCancelledForCarrier({ carrierName, job }) {
  return {
    subject: `A ${jobLabel(job.type)} you quoted on was cancelled`,
    html: layout({
      heading: 'Job cancelled',
      intro: `Hi ${esc(carrierName || 'there')},<br/>The customer has cancelled this request, so your quote is no longer active. No fee has been charged.`,
      body: table([
        ['From', areaOnly(job.pickup_address)],
        ['To', areaOnly(job.delivery_address)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/carrier/jobs`, label: 'Browse other jobs' },
    }),
  }
}

export function carrierApplicationReceived({ name }) {
  return {
    subject: "We've received your carrier application",
    html: layout({
      heading: 'Application received',
      intro: `Hi ${esc(name)},<br/>Thanks for applying to carry with Moving Easy. Our team reviews applications within 24 hours, and we'll email you as soon as you're approved.`,
      body: stepsList(PROFILE_STEPS),
      cta: { href: `${APP_URL()}/dashboard/carrier/settings`, label: 'Complete your profile' },
    }),
  }
}

export function carrierApplicationForAdmin({ name, company, email, carrierId }) {
  return {
    subject: `New carrier application: ${name}`,
    html: layout({
      heading: 'New carrier application',
      intro: 'A carrier has applied and is waiting for review.',
      body: table([
        ['Name', name],
        ['Company', company],
        ['Email', email],
      ]),
      cta: { href: `${APP_URL()}/admin/carriers/${carrierId}`, label: 'Review application' },
      footer: 'Sent to the Moving Easy admin address.',
    }),
  }
}

export function carrierApproved({ name, missingSteps = [] }) {
  const ready = missingSteps.length === 0
  return {
    subject: 'Your carrier account has been approved',
    html: layout({
      heading: "You're approved ✅",
      intro: ready
        ? `Hi ${esc(name || 'there')},<br/>Your carrier application has been approved. You can now quote on jobs.`
        : `Hi ${esc(name || 'there')},<br/>Your carrier application has been approved. Finish your profile and you'll be able to quote on jobs.`,
      body: ready ? '' : stepsList(missingSteps),
      cta: ready
        ? { href: `${APP_URL()}/dashboard/carrier/jobs`, label: 'Browse jobs' }
        : { href: `${APP_URL()}/dashboard/carrier`, label: 'Complete my profile' },
    }),
  }
}

export function profileReminder({ name, missingSteps }) {
  return {
    subject: 'Finish your Moving Easy profile to start quoting',
    html: layout({
      heading: 'Your profile is almost ready',
      intro: `Hi ${esc(name || 'there')},<br/>New moving jobs are being posted on Moving Easy. Complete your profile so you can start quoting and winning work.`,
      body: stepsList(missingSteps),
      cta: { href: `${APP_URL()}/dashboard/carrier`, label: 'Complete my profile' },
    }),
  }
}

export function carrierRejected({ name }) {
  return {
    subject: 'Update on your carrier application',
    html: layout({
      heading: 'Application not approved',
      intro: `Hi ${esc(name || 'there')},<br/>Thanks for your interest in Moving Easy. Unfortunately we can't approve your carrier application at this time.`,
      body: `<p style="color:#4b5563;font-size:14px;line-height:1.55;margin:0 0 24px">If you think this is a mistake, or your details have changed, reply to this email and our team will take another look.</p>`,
    }),
  }
}

export function walletTopupReceipt({ name, amount, balance, paymentRef }) {
  return {
    subject: `Receipt: ${money(amount)} wallet top-up`,
    html: layout({
      heading: 'Top-up received',
      intro: `Hi ${esc(name || 'there')},<br/>Your Moving Easy wallet has been topped up.`,
      body: table([
        ['Amount', money(amount), { strong: true, color: '#059669' }],
        ['New balance', balance != null ? money(balance) : null],
        ['Date', niceDate(new Date())],
        ['Payment reference', paymentRef, { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/carrier/wallet`, label: 'View wallet' },
    }),
  }
}

// ── Both ────────────────────────────────────────────────────────────────────

export function newChatMessage({ recipientName, senderName, preview, link }) {
  const text = preview.length > 300 ? `${preview.slice(0, 300)}…` : preview
  return {
    subject: `New message from ${senderName}`,
    html: layout({
      heading: 'You have a new message',
      intro: `Hi ${esc(recipientName || 'there')},<br/><strong>${esc(senderName)}</strong> sent you a message.`,
      body: quoteBlock(text),
      cta: { href: link, label: 'Reply →' },
      footer:
        'For your safety, keep conversations on Moving Easy. We only email you about the first message in a while, not every message.',
    }),
  }
}

// ── Booking lifecycle ───────────────────────────────────────────────────────

export function bookingCompletedForCustomer({ customerName, carrierName, job }) {
  return {
    subject: `How was your move with ${carrierName}?`,
    html: layout({
      heading: 'Your move is complete',
      intro: `Hi ${esc(customerName)},<br/>Your ${esc(jobLabel(job.type))} with <strong>${esc(carrierName)}</strong> has been marked as complete. A quick review helps other customers choose, and helps good movers get more work.`,
      body: table([
        ['From', areaOnly(job.pickup_address)],
        ['To', areaOnly(job.delivery_address)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/jobs/${job.id}#review`, label: 'Leave a review' },
      footer: "If the move isn't actually finished, reply to this email and we'll sort it out.",
    }),
  }
}

export function bookingCompletedForCarrier({ carrierName, job }) {
  return {
    subject: `Job marked complete: ${jobLabel(job.type)}`,
    html: layout({
      heading: 'Job complete ✅',
      intro: `Hi ${esc(carrierName || 'there')},<br/>The customer has marked this ${esc(jobLabel(job.type))} as complete. Thanks for a job well done.`,
      body: table([
        ['From', areaOnly(job.pickup_address)],
        ['To', areaOnly(job.delivery_address)],
        ['Job reference', ref(job.id), { mono: true }],
      ]),
      cta: { href: `${APP_URL()}/dashboard/carrier/bookings`, label: 'View bookings' },
    }),
  }
}

// Sent to the side that did NOT cancel.
export function bookingCancelled({ recipientName, cancelledBy, reason, reopened, job, forCarrier }) {
  const who =
    cancelledBy === 'admin' ? 'Moving Easy support' : cancelledBy === 'carrier' ? 'The mover' : 'The customer'
  const next = forCarrier
    ? 'No further action is needed from you.'
    : reopened
      ? 'Your request is open again — you can accept another quote or wait for new ones.'
      : 'Your request has been closed.'
  return {
    subject: `Booking cancelled: ${jobLabel(job.type)}`,
    html: layout({
      heading: 'Booking cancelled',
      intro: `Hi ${esc(recipientName || 'there')},<br/>${esc(who)} cancelled the booking for this ${esc(jobLabel(job.type))}. ${esc(next)}`,
      body:
        table([
          ['From', areaOnly(job.pickup_address)],
          ['To', areaOnly(job.delivery_address)],
          ['Job reference', ref(job.id), { mono: true }],
        ]) + (reason ? quoteBlock(`Reason: ${reason}`) : ''),
      cta: {
        href: forCarrier
          ? `${APP_URL()}/dashboard/carrier/bookings`
          : `${APP_URL()}/dashboard/jobs/${job.id}`,
        label: forCarrier ? 'View bookings' : reopened ? 'See your quotes' : 'View request',
      },
    }),
  }
}
