import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Share2, AtSign, Link2, Send, ChevronRight } from 'lucide-react'

const footerLinks = {
  quickLinks: [
    { label: 'About Us', href: '/about' },
    { label: 'Reviews', href: '/reviews' },
    { label: 'Contact Us', href: '/contact' },
  ],
  services: [
    { label: 'Cape Town', href: '/services/capetown' },
    { label: 'Johannesburg', href: '/services/johannesburg' },
    { label: 'Durban', href: '/services/durban' },
    { label: 'Pretoria', href: '/services/pretoria' },
    { label: 'Port Elizabeth', href: '/services/port-elizabeth' },
    { label: 'Bloemfontein', href: '/services/bloemfontein' },
    { label: 'Car transport', href: '/services/car-transport' },
    { label: 'Furniture removals', href: '/services/furniture-removals' },
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
        className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1 group"
      >
        <ChevronRight className="h-3.5 w-3.5 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-200" />
        {children}
      </Link>
    </li>
  )
}

export default function Footer() {
  return (
    <footer className="bg-slate-700 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image
                src="/main/move_eazy_logo.png"
                alt="Moving Easy"
                width={200}
                height={40}
                className="h-26 w-auto object-contain"
              />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
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
          <div className="flex flex-col items-start">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-5">
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

          {/* Get Prices */}
          {/* <div className="flex flex-col items-start">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-5">
              Get Prices
            </h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <FooterLink key={link.href} href={link.href}>
                  {link.label}
                </FooterLink>
              ))}
            </ul>
          </div> */}

          {/* Legal */}
          <div className="flex flex-col items-start">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-5">
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
            className="hover:text-slate-300 transition-colors text-sm text-slate-500"
          >
            &copy; 2026 Crestwave Digital PTY LTD. All development rights
            reserved.
          </a>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
