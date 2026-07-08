/**
 * `<AddressSuggestionItem />` — Renders a single address suggestion row.
 *
 * Supports both mouse click and keyboard (Enter) selection.
 * Highlights on hover and when focused via keyboard navigation.
 *
 * @module components/address/AddressSuggestionItem
 */

'use client'

import { memo } from 'react'
import type { AddressSuggestion } from '@/types/address'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddressSuggestionItemProps {
  /** The suggestion to render. */
  suggestion: AddressSuggestion

  /** Whether this item is currently highlighted (keyboard nav). */
  isActive: boolean

  /** Called when the user selects this suggestion. */
  onSelect: (suggestion: AddressSuggestion) => void

  /** Called when the mouse enters this item (updates keyboard nav index). */
  onMouseEnter: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Renders a subtle location badge (city, country) below the main address. */
function SubLabel({ suggestion }: { suggestion: AddressSuggestion }) {
  const parts = [suggestion.city, suggestion.state, suggestion.country].filter(
    Boolean,
  )
  if (parts.length === 0) return null
  return (
    <span className="text-xs text-gray-400 truncate">{parts.join(', ')}</span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressSuggestionItem = memo(function AddressSuggestionItem({
  suggestion,
  isActive,
  onSelect,
  onMouseEnter,
}: AddressSuggestionItemProps) {
  return (
    <li
      role="option"
      aria-selected={isActive}
      onMouseEnter={onMouseEnter}
      onMouseDown={(e) => {
        // Prevent the input from losing focus before the click registers
        e.preventDefault()
        onSelect(suggestion)
      }}
      className={`
        flex cursor-pointer items-center gap-3 px-4 py-3 text-sm transition-colors
        ${isActive ? 'bg-blue-50 text-blue-900' : 'text-gray-700 hover:bg-gray-50'}
      `}
    >
      {/* Pin icon */}
      <span className="mt-0.5 shrink-0 text-gray-400" aria-hidden>
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
          />
        </svg>
      </span>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {suggestion.address}
        </span>
        <SubLabel suggestion={suggestion} />
      </div>
    </li>
  )
})

export default AddressSuggestionItem
