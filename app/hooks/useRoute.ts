/**
 * `useRoute` — React hook for fetching a driving route between pickup
 * and delivery locations via OpenRouteService.
 *
 * ## Features
 * - Only fetches when both pickup AND delivery are present
 * - Aborts stale requests when locations change (prevents race conditions)
 * - In-memory caching (handled by `lib/routing/openRouteService.ts`)
 * - Loading / error / data state management
 * - Validates coordinates before making the API call
 *
 * ## Usage
 * ```tsx
 * const { route, loading, error } = useRoute(pickup, delivery)
 * ```
 *
 * @module hooks/useRoute
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { fetchRoute } from '@/lib/routing/openRouteService'
import { isValidLatLng } from '@/types/maps'
import type { Location } from '@/types/maps'
import type { RouteData, UseRouteOptions } from '@/types/routing'

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * React hook that fetches a driving route between two locations.
 *
 * Returns `null` for `route` until both locations are provided and the
 * API call succeeds. Handles cleanup (abort) on unmount and when
 * locations change.
 */
export function useRoute(
  pickup: Location | null | undefined,
  delivery: Location | null | undefined,
  options: UseRouteOptions = {},
) {
  const { apiKey, apiUrl } = options

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const [route, setRoute] = useState<RouteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Refs for cancellation
  const abortRef = useRef<AbortController | null>(null)

  // -----------------------------------------------------------------------
  // Effect — fetch when locations change
  // -----------------------------------------------------------------------

  const hasValidLocations = Boolean(
    pickup &&
      delivery &&
      isValidLatLng({ lat: pickup.latitude, lng: pickup.longitude }) &&
      isValidLatLng({ lat: delivery.latitude, lng: delivery.longitude }),
  )

  useEffect(() => {
    // Nothing to fetch; the hook returns an empty result below instead of
    // resetting state here (avoids a cascading re-render).
    if (!hasValidLocations) return

    // Abort any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const result = await fetchRoute(
          pickup!.latitude,
          pickup!.longitude,
          delivery!.latitude,
          delivery!.longitude,
          controller.signal,
          apiKey,
          apiUrl,
        )

        if (!cancelled) {
          setRoute(result)
          setLoading(false)
        }
      } catch (err) {
        // Ignore aborts — they're intentional
        if (err instanceof DOMException && err.name === 'AbortError') return

        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch route'
          setError(message)
          setRoute(null)
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    hasValidLocations,
    pickup?.latitude,
    pickup?.longitude,
    delivery?.latitude,
    delivery?.longitude,
    apiKey,
    apiUrl,
  ])

  if (!hasValidLocations) return { route: null, loading: false, error: null }
  return { route, loading, error }
}
