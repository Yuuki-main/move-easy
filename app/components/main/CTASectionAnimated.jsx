'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export default function CTASectionAnimated() {
  return (
    <section className="bg-gray-950 py-24 px-4 text-center">
      <motion.div
        className="max-w-2xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <h2 className="text-4xl font-black text-white tracking-tight mb-3">
          Ready to move?
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Get free quotes from verified carriers across India. No obligation, no
          hidden fees.
        </p>
        <Link
          href="/get-prices"
          className="inline-flex items-center justify-center bg-white text-gray-900 font-bold px-10 py-4 rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest text-sm"
        >
          Get free quotes
        </Link>
      </motion.div>
    </section>
  )
}
