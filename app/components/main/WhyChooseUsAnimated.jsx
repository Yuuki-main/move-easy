'use client'

import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function WhyChooseUsAnimated({ features }) {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3"
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {features.map((f, i) => (
        <motion.div
          key={f.title}
          variants={item}
          className={[
            'p-8 hover:bg-gray-50 transition-colors duration-200',
            i % 3 !== 2 ? 'sm:border-r border-gray-100' : '',
            i < features.length - 3 ? 'border-b border-gray-100' : '',
          ].join(' ')}
        >
          <div className="text-2xl mb-4">{f.emoji}</div>
          <h3 className="text-sm font-bold text-gray-900 mb-2">{f.title}</h3>
          <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
