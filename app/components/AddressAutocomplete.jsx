'use client'

import { useEffect, useRef, useState } from 'react'

export default function AddressAutocomplete({
  label,
  value,
  onChange,
  placeholder,
}) {
  const inputRef = useRef(null)

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <input
        ref={inputRef}
        value={value || ''}
        onChange={(e) => onChange(e.target.value, 0, 0)}
        placeholder={placeholder || 'Start typing an address...'}
        className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
