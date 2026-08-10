/**
 * Admin auth utilities for Edge Runtime (middleware).
 * Uses Web Crypto API instead of Node crypto.
 */

const COOKIE_NAME = 'admin_session'

async function sign(data, secret) {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data),
  )
  return Buffer.from(signature).toString('base64url')
}

export async function verifyAdminToken(token) {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) return null

  try {
    const lastDot = token.lastIndexOf('.')
    if (lastDot === -1) return null

    const encoded = token.slice(0, lastDot)
    const expectedSig = token.slice(lastDot + 1)
    const actualSig = await sign(encoded, secret)

    if (expectedSig !== actualSig) return null

    const payload = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8'),
    )

    if (Date.now() > payload.exp) return null

    return payload
  } catch {
    return null
  }
}

export { COOKIE_NAME }
