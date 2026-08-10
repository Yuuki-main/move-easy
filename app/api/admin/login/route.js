import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminToken, COOKIE_NAME, SESSION_DURATION } from '@/lib/admin-auth'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Admin credentials not configured' },
        { status: 500 },
      )
    }

    if (email !== adminEmail || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      )
    }

    const token = createAdminToken(email)
    const cookieStore = await cookies()

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_DURATION / 1000,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
