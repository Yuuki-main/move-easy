'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Package,
  CreditCard,
  LogOut,
} from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/carriers', label: 'Carriers', icon: Truck },
  { href: '/admin/jobs', label: 'Jobs', icon: Package },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <div className="flex gap-1">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname.startsWith(item.href) &&
              (item.href === '/admin' ? pathname === '/admin' : true)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
        >
          <LogOut size={16} />
          Logout Admin
        </button>
      </div>
    </nav>
  )
}
