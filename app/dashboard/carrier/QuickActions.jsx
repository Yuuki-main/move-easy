'use client'

import Link from 'next/link'
import { Package, MessageSquare, Star } from 'lucide-react'

const CARDS = [
  {
    href: '/dashboard/carrier/jobs',
    icon: Package,
    title: 'Available jobs',
    desc: 'Browse and quote on jobs',
  },
  {
    href: '/dashboard/carrier/quotes',
    icon: MessageSquare,
    title: 'My quotes',
    desc: 'Track your submitted quotes',
  },
  {
    href: '/dashboard/carrier/bookings',
    icon: Star,
    title: 'My bookings',
    desc: 'View your confirmed jobs',
  },
]

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      {CARDS.map(({ href, icon: Icon, title, desc }) => (
        <Link
          key={href}
          href={href}
          className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
        >
          <Icon size={28} className="text-gray-400 mb-2" />
          <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
          <p className="text-xs text-gray-400 mt-1">{desc}</p>
        </Link>
      ))}
    </div>
  )
}
