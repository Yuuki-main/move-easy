'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const FAQS = [
  {
    q: 'How much does it cost to use Moving Easy?',
    a: 'Getting quotes is completely free. You only pay the carrier you choose to book. There are no platform fees for customers.',
  },
  {
    q: 'How quickly will I receive quotes?',
    a: 'Most carriers respond within a few hours. Many requests receive their first quote within 30 minutes, especially during business hours.',
  },
  {
    q: 'Are the carriers verified?',
    a: 'Yes. All carriers go through a verification and approval process before they can quote on jobs. We check company details, GST registration, and service history.',
  },
  {
    q: 'Which cities do you cover in India?',
    a: 'We cover all major metros — Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad — plus hundreds of smaller cities and towns across India.',
  },
  {
    q: 'Can I transport my car or bike?',
    a: 'Absolutely. Select Car Transport or Motorcycle when creating your request. Carriers specialised in vehicle transport will send you quotes with enclosed or open carrier options.',
  },
  {
    q: 'What if something gets damaged during the move?',
    a: 'Carriers on our platform are professional and insured. In the rare event of damage, you can resolve it directly with the carrier. Our review system also keeps quality high.',
  },
]

export default function FAQSection() {
  const [open, setOpen] = useState(null)

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-10">
          Frequently asked questions
        </h2>

        <div>
          {FAQS.map((faq, i) => (
            <div key={i} className="border-b border-gray-100 py-5">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full text-left flex justify-between items-center gap-4 cursor-pointer"
              >
                <span className="text-base font-semibold text-gray-900">
                  {faq.q}
                </span>
                <span className="text-gray-400 text-xl font-light shrink-0">
                  {open === i ? '−' : '+'}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p className="text-sm text-gray-400 leading-relaxed pt-3">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
