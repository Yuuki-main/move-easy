/**
 * `<AddressAutocomplete />` — Production-ready address input with Photon-powered
 * autocomplete suggestions.
 *
 * ## Features
 * - Debounced API search (300 ms)
 * - Minimum 3 characters before searching
 * - Keyboard navigation (↑ ↓ Enter Escape Tab)
 * - Loading spinner, empty state, error state
 * - Fully accessible (ARIA roles, keyboard support)
 * - Tailwind-styled, responsive
 *
 * ## Usage
 * ```tsx
 * <AddressAutocomplete
 *   value={address}
 *   onChange={setAddress}
 *   onSelect={(s) => console.log(s.latitude, s.longitude)}
 *   label="Pickup address"
 *   required
 * />
 * ```
 *
 * @module components/address/AddressAutocomplete
 */

'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import { useAddressAutocomplete } from '@/hooks/useAddressAutocomplete'
import AddressSuggestionList from './AddressSuggestionList'
import type {
  AddressSuggestion,
  AddressAutocompleteProps,
} from '@/types/address'

// ---------------------------------------------------------------------------
// Icons (inline SVGs — no extra dependencies)
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4 text-gray-400"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
      />
    </svg>
  )
}

function ClearButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
      aria-label="Clear address"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddressAutocomplete = memo(function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address…',
  disabled = false,
  error,
  label,
  required = false,
  name,
}: AddressAutocompleteProps) {
  // Unique IDs for accessibility
  const id = useId()
  const listId = `address-list-${id}`
  const inputRef = useRef<HTMLInputElement>(null)

  // Dropdown visibility
  const [isOpen, setIsOpen] = useState(false)

  // Keyboard nav: which suggestion is highlighted (-1 = none)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Autocomplete hook
  const { suggestions, loading, search, clear } = useAddressAutocomplete()

  // -----------------------------------------------------------------------
  // Handlers
  // -----------------------------------------------------------------------

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      onChange(next)
      search(next)
      setIsOpen(true)
      setActiveIndex(-1)
    },
    [onChange, search],
  )

  const handleSelect = useCallback(
    (suggestion: AddressSuggestion) => {
      onChange(suggestion.address)
      onSelect(suggestion)
      setIsOpen(false)
      setActiveIndex(-1)
      clear()
      inputRef.current?.focus()
    },
    [onChange, onSelect, clear],
  )

  const handleClear = useCallback(() => {
    onChange('')
    setIsOpen(false)
    setActiveIndex(-1)
    clear()
    inputRef.current?.focus()
  }, [onChange, clear])

  const handleFocus = useCallback(() => {
    // Re-open if there's a value and suggestions
    if (value.trim().length >= 3) {
      search(value)
      setIsOpen(true)
    }
  }, [value, search])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // ArrowDown: open dropdown + highlight first item
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        e.preventDefault()
        setIsOpen(true)
        setActiveIndex(0)
        return
      }
      // Escape: close
      if (e.key === 'Escape') {
        setIsOpen(false)
        setActiveIndex(-1)
        return
      }
    },
    [suggestions],
  )

  // -----------------------------------------------------------------------
  // Derived state
  // -----------------------------------------------------------------------

  const showDropdown = isOpen && (loading || suggestions.length > 0)
  const showClear = value.length > 0 && !disabled

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Search icon */}
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </span>

        {/* Input */}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Delay close so click events on suggestions register
            setTimeout(() => {
              setIsOpen(false)
              setActiveIndex(-1)
            }, 150)
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl border bg-white py-2.5 pl-10 pr-10 text-sm
            text-gray-900 placeholder-gray-400
            transition-colors outline-none
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500
            ${error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
        />

        {/* Right-side slot: clear button or spinner */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Spinner />
          ) : showClear ? (
            <ClearButton onClick={handleClear} />
          ) : null}
        </span>

        {/* Dropdown */}
        {showDropdown && (
          <AddressSuggestionList
            suggestions={suggestions}
            activeIndex={activeIndex}
            onSelect={handleSelect}
            onActiveIndexChange={setActiveIndex}
            onEscape={() => {
              setIsOpen(false)
              setActiveIndex(-1)
              inputRef.current?.focus()
            }}
            listId={listId}
          />
        )}
      </div>

      {/* Empty state (shown when search yields no results) */}
      {isOpen && !loading && suggestions.length === 0 && value.trim().length >= 3 && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white py-3 text-center text-sm text-gray-400 shadow-lg">
          No addresses found.
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
})

export default AddressAutocomplete
