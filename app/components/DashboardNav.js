'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DashboardNav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [unreadCount, setUnreadCount] = useState(0)

  async function fetchUnread() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id)

    setUnreadCount(count || 0)
  }

  //   useEffect(() => {
  //     fetchUnread()
  //     const interval = setInterval(fetchUnread, 10000)
  //     return () => clearInterval(interval)
  //   }, [])

  useEffect(() => {
    const run = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('is_read', false)
        .neq('sender_id', user.id)

      setUnreadCount(count || 0)
    }

    run()
    const interval = setInterval(run, 10000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(path) {
    return pathname.startsWith(path)
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="text-blue-600 font-bold text-lg">
          WiseMove
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition
              ${
                isActive('/dashboard/customer') ||
                isActive('/dashboard/carrier')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/messages"
            className={`relative px-3 py-2 rounded-lg text-sm font-medium transition
              ${
                isActive('/dashboard/messages')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Messages
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/dashboard/profile"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition
              ${
                isActive('/dashboard/profile')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            Profile
          </Link>

          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}
