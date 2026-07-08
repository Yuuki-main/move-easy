/**
 * `<AddressSuggestionList />` — Dropdown list of address suggestions.
 *
 * Handles keyboard navigation (ArrowUp / ArrowDown / Enter / Escape)
 * and renders individual `<AddressSuggestionItem />` rows.
 *
 * ## Accessibility
 * - `role="listbox"` with `aria-label`
 * - Active descendant tracking via `aria-activedescendant`
 * - Keyboard fully supported alongside mouse
 *
 * @module components/address/AddressSuggestionList
 */

'use client'

import { memo, useCallback, useEffect, useRef } from 'react'
import type { AddressSuggestion } from '@/types/address'
import AddressSuggestionItem from './AddressSuggestionItem'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddressSuggestionListProps {
  /** Array of suggestions to display. */
  suggestions: AddressSuggestion[]

  /** Index of the currently highlighted item (-1 = none). */
  activeIndex: number

  /** Called when the user selects a suggestion (Enter or click). */
  onSelect: (suggestion: AddressSuggestion) => void

  /** Called when the active index changes (ArrowUp / ArrowDown / hover). */
  onActiveIndexChange: (index: number) => void

  /** Called when the user presses Escape. */
  onEscape: () => void

  /** ID prefix used for `aria-activedescendant`. */
  listId: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressSuggestionList = memo(function AddressSuggestionList({
  suggestions,
  activeIndex,
  onSelect,
  onActiveIndexChange,
  onEscape,
  listId,
}: AddressSuggestionListProps) {
  const listRef = useRef<HTMLUListElement>(null)

  // Scroll the active item into view when it changes
  useEffect(() => {
    if (activeIndex < 0) return
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  // -----------------------------------------------------------------------
  // Keyboard handler
  // -----------------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault()
          const next = activeIndex + 1 >= suggestions.length ? 0 : activeIndex + 1
          onActiveIndexChange(next)
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const prev = activeIndex - 1 < 0 ? suggestions.length - 1 : activeIndex - 1
          onActiveIndexChange(prev)
          break
        }
        case 'Enter': {
          e.preventDefault()
          if (activeIndex >= 0 && activeIndex < suggestions.length) {
            onSelect(suggestions[activeIndex])
          }
          break
        }
        case 'Escape': {
          e.preventDefault()
          onEscape()
          break
        }
        case 'Tab': {
          // Close the dropdown — parent handles this
          onEscape()
          break
        }
      }
    },
    [activeIndex, suggestions, onSelect, onActiveIndexChange, onEscape],
  )

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <ul
      ref={listRef}
      role="listbox"
      id={listId}
      aria-label="Address suggestions"
      aria-activedescendant={
        activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
      }
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="
        absolute left-0 right-0 top-full z-50 mt-1
        max-h-60 overflow-y-auto rounded-xl
        border border-gray-200 bg-white shadow-lg
      "
    >
      {suggestions.map((suggestion, index) => (
        <AddressSuggestionItem
          key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
          suggestion={suggestion}
          isActive={index === activeIndex}
          onSelect={onSelect}
          onMouseEnter={() => onActiveIndexChange(index)}
        />
      ))}
    </ul>
  )
})

export default AddressSuggestionList
