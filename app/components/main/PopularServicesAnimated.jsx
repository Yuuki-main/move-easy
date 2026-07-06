'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function PopularServicesAnimated({ services }) {
  return (
    <motion.div
      className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {services.map((s) => (
        <motion.div key={s.type} variants={item} className="shrink-0">
          <Link
            href={`/get-prices?type=${s.type}`}
            className="flex flex-col items-start gap-3 min-w-[160px] bg-white border border-gray-100 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">
              {s.emoji}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{s.label}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}
