'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0 },
}

export default function RecentReviewsAnimated({ reviews }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {reviews.map((r) => {
        const daysAgo = Math.floor(
          (Date.now() - new Date(r.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        )
        const timeAgo =
          daysAgo === 0
            ? 'Today'
            : daysAgo === 1
              ? 'Yesterday'
              : `${daysAgo} days ago`

        return (
        <motion.div
          key={r.id}
          variants={item}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden"
        >
          {/* Decorative quote mark */}
          <div className="absolute top-3 right-5 text-6xl text-gray-100 font-black leading-none select-none pointer-events-none">
            &ldquo;
          </div>

          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 bg-gray-900 text-white rounded-lg flex items-center justify-center font-black text-lg shrink-0">
              {r.rating.toFixed(1)}
            </div>
            <div>
              {r.carrierId ? (
                <Link
                  href={`/carrier/${r.carrierId}`}
                  className="font-bold text-sm text-gray-900 hover:underline"
                >
                  {r.carrierName ?? 'Carrier'}
                </Link>
              ) : (
                <p className="font-bold text-sm text-gray-900">
                  {r.carrierName ?? 'Carrier'}
                </p>
              )}
              <p className="text-xs text-gray-400">{timeAgo}</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic flex-1 leading-relaxed relative z-10">
            &ldquo;{r.comment}&rdquo;
          </p>

          {r.route && (
            <div className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <span className="truncate max-w-[100px]">{r.route.from}</span>
              <span className="shrink-0">→</span>
              <span className="truncate max-w-[100px]">{r.route.to}</span>
            </div>
          )}
        </motion.div>
      )})}
    </motion.div>
  )
}
