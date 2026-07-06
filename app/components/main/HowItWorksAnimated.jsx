'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function HowItWorksAnimated({ steps }) {
  return (
    <div>
      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          className={`flex flex-col md:flex-row gap-12 items-center mb-20 ${
            i % 2 !== 0 ? 'md:flex-row-reverse' : ''
          }`}
          initial={{ opacity: 0, x: i % 2 === 0 ? -60 : 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Image */}
          <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden relative">
            <Image
              src={step.image}
              alt={step.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Text */}
          <div className="w-full md:w-1/2">
            <div className="text-[120px] font-black text-gray-100 leading-none select-none">
              {step.num}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-3">
              {step.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
