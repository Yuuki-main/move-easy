'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Truck, Package, CreditCard } from 'lucide-react'

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/carriers', label: 'Carriers', icon: Truck },
  { href: '/admin/jobs', label: 'Jobs', icon: Package },
  { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
]

export default function AdminLayout({ children }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 flex gap-1">
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
      </nav>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
