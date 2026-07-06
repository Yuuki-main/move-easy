'use client'

import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'
import { useEffect, useRef } from 'react'

function CountUp({ value }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const display = useTransform(count, (v) => v.toFixed(1))

  useEffect(() => {
    if (isInView) {
      const controls = animate(count, value, { duration: 1.5, ease: 'easeOut' })
      return () => controls.stop()
    }
  }, [isInView, count, value])

  return <motion.span ref={ref}>{display}</motion.span>
}

function ProgressBar({ pct }) {
  return (
    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gray-900 rounded-full"
        initial={{ width: '0%' }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </div>
  )
}

const ROWS = [
  { label: 'Excellent', key: 'excellent' },
  { label: 'Great', key: 'great' },
  { label: 'Average', key: 'average' },
  { label: 'Poor', key: 'poor' },
]

export default function RatingBreakdownAnimated({ avg, total, bins }) {
  return (
    <div className="text-center">
      <div className="text-9xl font-black text-gray-900 leading-none">
        <CountUp value={avg} />
      </div>
      <div className="text-xl font-bold text-gray-700 mt-2">Exceptional</div>
      <div className="text-sm text-gray-400 mt-1">
        Based on {total.toLocaleString()} reviews
      </div>

      <div className="mt-10 max-w-sm mx-auto space-y-3">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[80px_1fr_40px] gap-3 items-center"
          >
            <span className="text-xs text-gray-500 text-left">{row.label}</span>
            <ProgressBar pct={total ? (bins[row.key] / total) * 100 : 0} />
            <span className="text-xs text-gray-400 text-right">
              {bins[row.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
