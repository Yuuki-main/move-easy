import { createHmac, timingSafeEqual } from 'crypto'

const ALGORITHM = 'sha256'
const SESSION_DURATION = 24 * 60 * 60 * 1000 // 24 hours
const COOKIE_NAME = 'admin_session'

/**
 * Create a signed session token.
 * Format: base64url(payload).base64url(signature)
 */
export function createAdminToken(email) {
  const payload = JSON.stringify({
    email,
    exp: Date.now() + SESSION_DURATION,
  })
  const encoded = Buffer.from(payload).toString('base64url')
  const signature = sign(encoded)
  return `${encoded}.${signature}`
}

/**
 * Verify a token and return the payload, or null if invalid/expired.
 */
export function verifyAdminToken(token) {
  try {
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return null

    const encoded = token.slice(0, lastDot)
    const signature = token.slice(lastDot + 1)

    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(encoded)))) {
      return null
    }

    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))

    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}

function sign(data) {
  return createHmac(ALGORITHM, getSecret()).update(data).digest('base64url')
}

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not set')
  return secret
}

export { COOKIE_NAME, SESSION_DURATION }
