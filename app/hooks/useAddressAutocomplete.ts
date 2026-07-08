/**
 * `useAddressAutocomplete` — React hook for Photon-powered address search.
 *
 * ## Features
 * - Debounced input (default 300 ms)
 * - Minimum character threshold (default 3)
 * - Request cancellation via AbortController (prevents race conditions)
 * - Built-in loading / error / empty state management
 * - In-memory caching (handled by the Photon client in `lib/geocoding/photon.ts`)
 *
 * ## Usage
 * ```tsx
 * const { suggestions, loading, error, search } = useAddressAutocomplete()
 * search('Christchurch')
 * ```
 *
 * @module hooks/useAddressAutocomplete
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { searchPhoton } from '@/lib/geocoding/photon'
import type {
  AddressSuggestion,
  UseAddressAutocompleteOptions,
} from '@/types/address'

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const DEFAULT_DEBOUNCE_MS = 300
const DEFAULT_MIN_CHARS = 3
const DEFAULT_LIMIT = 5

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook for address autocomplete via the Photon geocoding API.
 *
 * Returns `suggestions`, `loading`, and `error` state, plus a `search()`
 * function that accepts a raw query string. The hook handles debouncing,
 * aborting stale requests, and the minimum-character threshold internally.
 */
export function useAddressAutocomplete(
  options: UseAddressAutocompleteOptions = {},
) {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minChars = DEFAULT_MIN_CHARS,
    limit = DEFAULT_LIMIT,
    apiUrl,
  } = options

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs that must survive re-renders
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const lastQueryRef = useRef<string>('')

  // -----------------------------------------------------------------------
  // Cleanup on unmount
  // -----------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  // -----------------------------------------------------------------------
  // Search function (debounced)
  // -----------------------------------------------------------------------

  const search = useCallback(
    (query: string) => {
      // Clear previous debounce timer
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      // Bail early: empty query → clear everything
      if (!query || query.trim().length < minChars) {
        setSuggestions([])
        setLoading(false)
        setError(null)
        lastQueryRef.current = ''
        return
      }

      const trimmed = query.trim()

      // Debounce
      debounceRef.current = setTimeout(async () => {
        // Abort any in-flight request
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        lastQueryRef.current = trimmed
        setLoading(true)
        setError(null)

        try {
          const results = await searchPhoton(trimmed, controller.signal, limit)
          // Only apply results if this is still the latest query
          if (lastQueryRef.current === trimmed) {
            setSuggestions(results)
            setLoading(false)
          }
        } catch (err) {
          // Ignore abort errors — they're intentional
          if (err instanceof DOMException && err.name === 'AbortError') return

          const message =
            err instanceof Error ? err.message : 'Failed to search addresses'
          setError(message)
          setSuggestions([])
          setLoading(false)
        }
      }, debounceMs)
    },
    [debounceMs, minChars, limit],
  )

  // -----------------------------------------------------------------------
  // Clear function (for external reset)
  // -----------------------------------------------------------------------

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()
    setSuggestions([])
    setLoading(false)
    setError(null)
    lastQueryRef.current = ''
  }, [])

  return { suggestions, loading, error, search, clear }
}
