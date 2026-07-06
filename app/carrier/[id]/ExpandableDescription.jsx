'use client'

import { useState } from 'react'

export default function ExpandableDescription({ name, description }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50">
      <p className="font-bold text-sm text-gray-900 mb-2">{name}</p>
      <p
        className={`text-sm text-gray-500 leading-relaxed ${
          expanded ? '' : 'line-clamp-4'
        }`}
      >
        {description}
      </p>
      <button
        onClick={() => setExpanded((p) => !p)}
        className="text-xs font-bold tracking-widest uppercase text-gray-900 mt-3 hover:underline"
      >
        {expanded ? 'READ LESS' : 'READ MORE'}
      </button>
    </div>
  )
}
