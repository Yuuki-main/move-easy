'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { Truck, Menu, X, ChevronDown, User, LogOut, Info, Phone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const MOBILE_VARIANTS = {
  closed: {
    opacity: 0,
    x: '100%',
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] },
  },
  open: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.32, 0.72, 0, 1] },
  },
}

const ITEM_VARIANTS = {
  closed: { opacity: 0, x: 20 },
  open: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.1 + i * 0.04, duration: 0.3 },
  }),
}

const RESOURCES_ITEMS = [
  { label: 'About us', href: '/about', icon: Info, desc: 'Our story and mission' },
  { label: 'Contact us', href: '/contact', icon: Phone, desc: 'Get in touch with us' },
]

function getNavLinks(role) {
  const isCarrier = role === 'carrier'
  return [
    ...(!isCarrier ? [{ label: 'Get Prices', href: '/get-prices' }] : []),
    ...(role
      ? [
          {
            label: isCarrier ? 'Browse Jobs' : 'My Deliveries',
            href: isCarrier ? '/dashboard/carrier/jobs' : '/dashboard/jobs',
          },
        ]
      : []),
    { label: 'Reviews', href: '/reviews' },
  ]
}

export default function NavbarClient({ user, firstName, role, unreadCount }) {
  const isCarrier = role === 'carrier'
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [resourcesOpen, setResourcesOpen] = useState(false)
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false)
  const avatarRef = useRef(null)
  const resourcesRef = useRef(null)

  const navLinks = getNavLinks(role)
  const initial = firstName ? firstName.charAt(0).toUpperCase() : '?'

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    function handleClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setAvatarOpen(false)
      }
    }
    if (avatarOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [avatarOpen])

  useEffect(() => {
    function handleClick(e) {
      if (resourcesRef.current && !resourcesRef.current.contains(e.target)) {
        setResourcesOpen(false)
      }
    }
    if (resourcesOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [resourcesOpen])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/95 backdrop-blur-md shadow-lg shadow-slate-200/20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <Image
                src="/main/move_eazy_logo.png"
                alt="Moving Easy"
                width={140}
                height={32}
                className="h-16 w-auto object-contain"
              />
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-600 hover:text-zinc-900 hover:bg-zinc-50"
                >
                  {link.label}
                </Link>
              ))}

              {/* Resources dropdown */}
              <div ref={resourcesRef} className="relative">
                <button
                  onClick={() => setResourcesOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-600 hover:text-zinc-900 hover:bg-zinc-50"
                >
                  Resources
                  <motion.span
                    animate={{ rotate: resourcesOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-flex"
                  >
                    <ChevronDown size={14} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {resourcesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-zinc-100 py-2 z-50"
                    >
                      {RESOURCES_ITEMS.map(({ label, href, icon: Icon, desc }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setResourcesOpen(false)}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors group"
                        >
                          <span className="mt-0.5 flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
                            <Icon size={14} className="text-zinc-600" />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-zinc-900">{label}</p>
                            <p className="text-xs text-zinc-400">{desc}</p>
                          </div>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right side: Auth */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <div ref={avatarRef} className="relative">
                  <button
                    onClick={() => setAvatarOpen((v) => !v)}
                    className="relative flex items-center gap-3 px-4 h-10 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-colors"
                  >
                    {unreadCount > 0 && (
                      <span className="absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full bg-pink-600 text-white text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                    <span className="text-sm font-medium text-zinc-900">
                      {firstName || 'User'}
                    </span>
                  </button>

                  <AnimatePresence>
                    {avatarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-zinc-100 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-zinc-100">
                          <p className="text-sm font-semibold text-zinc-900">
                            {firstName || 'User'}
                          </p>
                          <p className="text-xs text-zinc-500 capitalize">
                            {role || 'customer'}
                          </p>
                        </div>

                        <Link
                          href={isCarrier ? '/dashboard/carrier/jobs' : '/dashboard/jobs'}
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <Truck size={15} />
                          {isCarrier ? 'Browse Jobs' : 'My Jobs'}
                        </Link>

                        <Link
                          href={isCarrier ? '/dashboard/carrier' : '/dashboard'}
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <User size={15} />
                          Dashboard
                        </Link>

                        <Link
                          href="/dashboard/account"
                          onClick={() => setAvatarOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
                        >
                          <User size={15} />
                          Account
                        </Link>

                        <div className="border-t border-zinc-100 mt-1 pt-1">
                          <button
                            onClick={() => {
                              setAvatarOpen(false)
                              handleLogout()
                            }}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <LogOut size={15} />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-zinc-900 text-white hover:bg-black transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            />

            <motion.div
              variants={MOBILE_VARIANTS}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white shadow-2xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900">
                    <Truck className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    Moving<span className="text-zinc-900">Easy</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-4 px-3">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    variants={ITEM_VARIANTS}
                    custom={i}
                    initial="closed"
                    animate="open"
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-4 py-3 text-base font-medium text-slate-700 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Resources accordion */}
                <motion.div
                  variants={ITEM_VARIANTS}
                  custom={navLinks.length}
                  initial="closed"
                  animate="open"
                >
                  <button
                    onClick={() => setMobileResourcesOpen((v) => !v)}
                    className="flex items-center justify-between w-full px-4 py-3 text-base font-medium text-slate-700 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                  >
                    Resources
                    <motion.span
                      animate={{ rotate: mobileResourcesOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} />
                    </motion.span>
                  </button>

                  <AnimatePresence>
                    {mobileResourcesOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden ml-4"
                      >
                        {RESOURCES_ITEMS.map(({ label, href, icon: Icon }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setMobileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
                          >
                            <Icon size={14} className="text-zinc-400" />
                            {label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </nav>

              <div className="p-4 border-t border-slate-100 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 px-2 py-1 mb-2">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-zinc-900 text-white text-sm font-bold">
                        {initial}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">
                          {firstName || 'User'}
                        </p>
                        <p className="text-xs text-zinc-500 capitalize">
                          {role || 'customer'}
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg px-4"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/account"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 rounded-lg px-4"
                    >
                      Account
                    </Link>
                    <button
                      onClick={() => {
                        setMobileOpen(false)
                        handleLogout()
                      }}
                      className="block w-full py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg px-4 text-left"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-2.5 text-sm font-medium text-center text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block w-full py-2.5 text-sm font-semibold text-center text-white bg-zinc-900 rounded-lg hover:bg-black"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
