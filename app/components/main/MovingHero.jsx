'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const JOB_TYPES = [
  { value: 'home_move', label: 'Home Move', icon: '🏠' },
  { value: 'office_move', label: 'Office Move', icon: '🏢' },
  { value: 'storage_move', label: 'Storage', icon: '🏪' },
  { value: 'furniture', label: 'Furniture', icon: '🛋️' },
  { value: 'item', label: 'Parcel / Item', icon: '📦' },
  { value: 'car', label: 'Car Transport', icon: '🚗' },
  { value: 'motorcycle', label: 'Motorcycle Transport', icon: '🏍️' },
  { value: 'other_vehicle', label: 'Other Vehicle', icon: '🚛' },
  { value: 'boat', label: 'Boat Transport', icon: '⛵' },
  { value: 'piano', label: 'Piano Move', icon: '🎹' },
  { value: 'pet', label: 'Pet Transport', icon: '🐾' },
  { value: 'junk', label: 'Junk Removal', icon: '🗑️' },
  { value: 'other', label: 'Other', icon: '📋' },
]

export default function MovingHero({ reviewCount, avgRating }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleGetPrices = () => {
    const type = selected?.value || ''
    router.push(`/get-prices${type ? `?type=${type}` : ''}`)
  }

  return (
    <section className="relative min-h-screen flex items-center bg-black -mt-20">
      <Image
        src="/main/moving_hero_img.jpg"
        alt="Moving company"
        fill
        priority
        className="object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

      <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 py-20">
        <motion.div
          className="w-full max-w-[480px] bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-black tracking-tight text-gray-900 leading-tight">
            India&apos;s best moving teams — ready for your move
          </h1>

          <p className="text-gray-500 text-sm mt-2 mb-6">
            Compare quotes from verified carriers. Any size, any move — fast,
            safe, reliable.
          </p>

          {/* Dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              aria-expanded={open}
              aria-haspopup="listbox"
              onClick={() => setOpen((v) => !v)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
                {selected ? selected.label : 'What are you moving?'}
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {open && (
              <div
                role="listbox"
                className="absolute top-full left-0 w-full bg-white border border-gray-200 shadow-2xl z-50 rounded-xl overflow-hidden max-h-[360px] overflow-y-auto mt-1"
              >
                {JOB_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSelected(opt)
                      setOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <button
            type="button"
            onClick={handleGetPrices}
            className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-4 rounded-xl uppercase tracking-widest text-sm mt-3 transition-all duration-200"
          >
            Get Prices
          </button>

          {/* Rating strip */}
          {avgRating && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-4">
              <svg className="w-3.5 h-3.5 fill-gray-400" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-semibold text-gray-500">
                {avgRating.toFixed(1)}
              </span>
              <span>· {reviewCount?.toLocaleString() || '0'} reviews</span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  )
}
