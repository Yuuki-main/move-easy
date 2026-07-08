/**
 * OpenRouteService Directions API client.
 *
 * Uses the ORS v2 Directions API to calculate driving routes between
 * two geographic coordinates.
 *
 * ## API key
 *
 * Uses `NEXT_PUBLIC_ORS_API_KEY` from environment. The `NEXT_PUBLIC_`
 * prefix is intentional — this hook runs in the browser. In production
 * you may want to proxy through a Next.js API route to keep the key
 * server-side.
 *
 * @see https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/post
 *
 * @module lib/routing/openRouteService
 */

import type { RouteData, OrsDirectionsResponse } from '@/types/routing'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Default ORS Directions API endpoint (driving car profile). */
const DEFAULT_ORS_URL =
  'https://api.openrouteservice.org/v2/directions/driving-car'

/** Default API key from environment. */
const DEFAULT_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY ?? ''

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

/**
 * Cache keyed by a stable coordinate fingerprint.
 *
 * Cache entries live for 10 minutes — routes between the same two points
 * don't change frequently, so a longer TTL is acceptable.
 */
const routeCache = new Map<
  string,
  { data: RouteData; expiresAt: number }
>()

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function getCached(key: string): RouteData | null {
  const entry = routeCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    routeCache.delete(key)
    return null
  }
  return entry.data
}

function setCached(key: string, data: RouteData): void {
  routeCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

/**
 * Builds a stable cache key from two coordinate pairs.
 * Rounds to 5 decimal places (~1.1 m precision) to avoid cache misses
 * from floating-point jitter.
 */
function cacheKey(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): string {
  return [
    lat1.toFixed(5),
    lng1.toFixed(5),
    lat2.toFixed(5),
    lng2.toFixed(5),
  ].join(',')
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches a driving route between two geographic points from OpenRouteService.
 *
 * Results are cached in-memory for 10 minutes.
 *
 * @param originLat   - Origin latitude.
 * @param originLng   - Origin longitude.
 * @param destLat     - Destination latitude.
 * @param destLng     - Destination longitude.
 * @param signal      - Optional AbortSignal for request cancellation.
 * @param apiKey      - ORS API key (defaults to `NEXT_PUBLIC_ORS_API_KEY`).
 * @param baseUrl     - ORS Directions endpoint URL.
 *
 * @returns A promise resolving to `RouteData`.
 *
 * @throws {Error} On network failure, non-OK response, or missing API key.
 */
export async function fetchRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  signal?: AbortSignal,
  apiKey: string = DEFAULT_API_KEY,
  baseUrl: string = DEFAULT_ORS_URL,
): Promise<RouteData> {
  // Validate API key
  if (!apiKey) {
    throw new Error(
      'OpenRouteService API key is missing. Set NEXT_PUBLIC_ORS_API_KEY in .env.local.',
    )
  }

  // Check cache
  const key = cacheKey(originLat, originLng, destLat, destLng)
  const cached = getCached(key)
  if (cached) return cached

  // ORS expects coordinates as [[lng, lat], [lng, lat]]
  const body = {
    coordinates: [
      [originLng, originLat],
      [destLng, destLat],
    ],
  }

  // Fetch
  let response: Response
  try {
    response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: apiKey,
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error(`Network error fetching route: ${String(err)}`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `ORS API returned ${response.status}: ${response.statusText}${text ? ` — ${text}` : ''}`,
    )
  }

  // Parse
  let json: OrsDirectionsResponse
  try {
    json = await response.json()
  } catch {
    throw new Error('ORS API returned invalid JSON')
  }

  const route = json?.routes?.[0]
  if (!route?.geometry?.coordinates?.length) {
    throw new Error('ORS API returned an empty route')
  }

  const result: RouteData = {
    coordinates: route.geometry.coordinates,
    distanceMeters: route.summary.distance,
    durationSeconds: route.summary.duration,
  }

  setCached(key, result)
  return result
}
