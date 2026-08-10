import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth-edge'

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (!user && request.nextUrl.pathname.startsWith('/for-carriers/register')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protect /admin/* with admin session cookie (except /admin/login)
  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    request.nextUrl.pathname !== '/admin/login'
  ) {
    const token = request.cookies.get(COOKIE_NAME)?.value
    const payload = token ? await verifyAdminToken(token) : null

    if (!payload) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  response.headers.set('x-pathname', request.nextUrl.pathname)

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/for-carriers/register', '/admin/:path*'],
}
