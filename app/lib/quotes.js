// Shared quote helpers — used by the carrier quote board, the carrier's
// "my quote" preview, the amend API and the customer-facing quote views.

// Share of the accepted quote price deducted from the carrier's wallet.
export const PLATFORM_FEE_RATE = 0.18

export const MAX_QUOTE_MESSAGE = 2000

// A quote price in dollars: positive, under $1M, at most 2 decimal places.
export function parsePrice(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Math.round(Number(value) * 100) / 100
  return Number.isFinite(n) && n >= 1 && n < 1_000_000 ? n : null
}

export const PAYMENT_TIMEFRAMES = [
  'Before collection',
  'At collection',
  'At delivery',
  'After delivery',
]

export const PAYMENT_METHODS = [
  'Cash',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Cheque',
]

export const COLLECTION_DATE_TYPES = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'within_days', label: 'Within … days' },
  { value: 'on', label: 'On a date' },
  { value: 'from', label: 'From a date' },
  { value: 'before', label: 'Before a date' },
  { value: 'between', label: 'Between two dates' },
]

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

export function formatMoney(n) {
  const v = Number(n)
  return `$${v.toLocaleString('en-NZ', {
    minimumFractionDigits: Number.isInteger(v) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`
}

// The collection window the carrier committed to on their quote.
export function formatCollectionWindow(quote) {
  const { collection_date_type: type } = quote ?? {}
  const from = quote?.collection_date_from
  const to = quote?.collection_date_to
  switch (type) {
    case 'within_days':
      return `collection within ${quote.collection_within_days} day${quote.collection_within_days === 1 ? '' : 's'}`
    case 'on':
      return from ? `collection on ${fmtDate(from)}` : 'collection date flexible'
    case 'from':
      return from ? `collection from ${fmtDate(from)}` : 'collection date flexible'
    case 'before':
      return to ? `collection before ${fmtDate(to)}` : 'collection date flexible'
    case 'between':
      return from && to
        ? `collection ${fmtDate(from)} – ${fmtDate(to)}`
        : 'collection date flexible'
    default:
      return 'collection date flexible'
  }
}

// The customer's requested move window from the job.
export function formatJobMoveWindow(job) {
  const from = job?.move_date_from
  const to = job?.move_date_to
  if (!from) return 'Flexible'
  if (to && to !== from) return `${fmtDate(from)} – ${fmtDate(to)}`
  return fmtDate(from)
}

// A quote's own payment terms win; otherwise fall back to the carrier profile.
export function effectivePaymentTerms(quote, carrier) {
  return {
    timeframes: quote?.payment_timeframes ?? carrier?.payment_timeframes ?? [],
    methods: quote?.payment_methods ?? carrier?.payment_methods ?? [],
  }
}

export function isQuoteExpired(quote, now = Date.now()) {
  return Boolean(quote?.expires_at) && new Date(quote.expires_at).getTime() <= now
}

// Where this carrier stands against every other live bid on the job.
export function leadStatus(myPrice, competitorPrices) {
  if (!competitorPrices.length) return { kind: 'only', diff: 0 }
  const lowestOther = Math.min(...competitorPrices)
  const mine = Number(myPrice)
  if (mine < lowestOther) return { kind: 'leading', diff: lowestOther - mine }
  if (mine === lowestOther) return { kind: 'tie', diff: 0 }
  return { kind: 'losing', diff: mine - lowestOther, target: lowestOther }
}

export function shortJobRef(jobId) {
  return jobId ? jobId.slice(0, 6).toUpperCase() : ''
}

export function relativeTime(date, now = Date.now()) {
  const secs = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000))
  if (secs < 60) return 'just now'
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  const rem = days % 7
  return rem ? `${weeks}w ${rem}d ago` : `${weeks}w ago`
}

// Straight-line distance; good enough for a list column labelled "approx".
export function distanceKm(job) {
  const { pickup_lat: a1, pickup_lng: o1, delivery_lat: a2, delivery_lng: o2 } =
    job ?? {}
  if ([a1, o1, a2, o2].some((v) => v == null)) return null
  const rad = (d) => (d * Math.PI) / 180
  const dLat = rad(a2 - a1)
  const dLng = rad(o2 - o1)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a1)) * Math.cos(rad(a2)) * Math.sin(dLng / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(h)))
}

export function shortAddress(address) {
  if (!address) return ''
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return parts.length >= 2
    ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    : address
}

export function jobTitle(job) {
  return (job?.type ?? 'move')
    .split('_')
    .map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ')
}
