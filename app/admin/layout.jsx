import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyAdminToken, COOKIE_NAME } from '@/lib/admin-auth'
import AdminNav from './AdminNav'

export default async function AdminLayout({ children }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') || ''

  // Login page — render without nav, no auth check
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Check admin session for all other admin routes
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  const payload = token ? verifyAdminToken(token) : null

  if (!payload) {
    redirect('/admin/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav />
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
