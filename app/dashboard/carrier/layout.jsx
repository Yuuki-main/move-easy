'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Package,
  Wallet,
  User,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard/carrier', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/carrier/jobs', label: 'Browse Jobs', icon: Search },
  { href: '/dashboard/carrier/quotes', label: 'My Quotes', icon: MessageSquare },
  { href: '/dashboard/carrier/bookings', label: 'Bookings', icon: Package },
  { href: '/dashboard/carrier/wallet', label: 'Wallet', icon: Wallet },
  { href: '/dashboard/carrier/profile', label: 'Profile', icon: User },
]

export default function CarrierLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {NAV.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname.startsWith(item.href) &&
              (item.href === '/dashboard/carrier'
                ? pathname === '/dashboard/carrier'
                : true)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-teal-600 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
