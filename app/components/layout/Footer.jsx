import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Share2, AtSign, Link2, Send, ChevronRight, ArrowRight, Mail } from 'lucide-react'

const footerLinks = {
  quickLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Contact Us', href: '/contact' },
  ],
  // Keep in sync with SERVICES in app/services/[slug]/page.jsx
  services: [
    { label: 'Home moves', href: '/services/home-move' },
    { label: 'Office moves', href: '/services/office-move' },
    { label: 'Furniture removals', href: '/services/furniture-removal' },
    { label: 'Car transport', href: '/services/car-transport' },
    { label: 'Storage', href: '/services/storage' },
    { label: 'Junk removal', href: '/services/junk-removal' },
  ],
  movers: [
    { label: 'Become a mover', href: '/carrier-register' },
    { label: 'Mover login', href: '/login' },
    { label: 'Browse jobs', href: '/dashboard/carrier/jobs' },
    { label: 'How it works for movers', href: '/for-movers' },
  ],
  legal: [
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
}

const socialLinks = [
  { icon: Share2, href: 'https://facebook.com/your-page', label: 'Facebook' },
  { icon: AtSign, href: 'https://twitter.com/your-page', label: 'Twitter' },
  { icon: Link2, href: 'https://instagram.com/your-page', label: 'Instagram' },
  {
    icon: Send,
    href: 'https://linkedin.com/company/your-page',
    label: 'LinkedIn',
  },
]

function FooterLink({ href, children }) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm text-black hover:text-[#1c293c] transition-colors flex items-center gap-1 group hover:font-semibold"
      >
        <ChevronRight className="h-3.5 w-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
        {children}
      </Link>
    </li>
  )
}

export default function Footer() {
  return (
    <footer className="bg-white text-black">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/main/move_eazy_logo.png"
                alt="Moving Easy"
                width={200}
                height={40}
                className="h-26 w-auto object-contain"
              />
            </Link>
            <p className="text-black text-sm leading-relaxed mb-6">
              Your trusted platform for finding reliable movers. Compare quotes,
              read reviews, and book with confidence. Moving made simple.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  title={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-zinc-900 hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="flex flex-col items-start lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-black mb-5">
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="flex flex-col items-start lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-black mb-5">
              Services
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* For Movers */}
          <div className="flex flex-col items-start lg:col-span-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-black mb-5">
              For Movers
            </h4>
            <ul className="space-y-3">
              {footerLinks.movers.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          {/* Get quotes + contact, then Legal */}
          <div className="flex flex-col items-start sm:col-span-2 lg:col-span-3">
            <div className="w-full rounded-2xl bg-zinc-900 p-5 text-white mb-8">
              <p className="text-base font-semibold">Moving soon?</p>
              <p className="mt-1 text-sm text-zinc-300">
                Compare quotes from trusted movers — it&apos;s free.
              </p>
              <Link
                href="/get-prices"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Get free quotes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:support@movingeasy.co.nz"
                className="mt-4 flex items-center gap-2 text-sm text-zinc-300 transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4" />
                support@movingeasy.co.nz
              </a>
            </div>

            <h4 className="text-sm font-semibold uppercase tracking-wider text-black mb-5">
              Legal
            </h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href="https://crestwave.com.au/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#1c293c]  transition-colors text-sm text-black"
          >
            &copy; 2026 Crestwave Digital PTY LTD. All development rights
            reserved.
          </a>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-black hover:text-[#1c293c] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-black hover:text-[#1c293c] transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
