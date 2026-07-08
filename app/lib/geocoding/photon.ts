/**
 * Photon geocoding API client.
 *
 * Photon is a free, OpenStreetMap-based geocoding API.
 * No API key required. Rate limits are generous (~1 req/s).
 *
 * @see https://photon.komoot.io/
 *
 * @module lib/geocoding/photon
 */

import type {
  AddressSuggestion,
  PhotonFeature,
  PhotonResponse,
} from '@/types/address'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Base URL for the Photon API. */
const PHOTON_BASE_URL = 'https://photon.komoot.io/api/'

/** Default request limit. */
const DEFAULT_LIMIT = 5

// ---------------------------------------------------------------------------
// In-memory cache
// ---------------------------------------------------------------------------

/**
 * Simple in-memory cache keyed by the raw search query.
 *
 * Cache entries live for 5 minutes (TTL) to keep the cache fresh
 * without hammering the API for repeated searches.
 */
const cache = new Map<string, { data: AddressSuggestion[]; expiresAt: number }>()

/** Cache TTL in milliseconds. */
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Looks up a cached result. Returns `null` on miss or expiry.
 */
function getCached(query: string): AddressSuggestion[] | null {
  const entry = cache.get(query)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(query)
    return null
  }
  return entry.data
}

/**
 * Stores a result in the cache.
 */
function setCached(query: string, data: AddressSuggestion[]): void {
  cache.set(query, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

/**
 * Builds a human-readable address string from Photon feature properties.
 *
 * Priority: housenumber + street → name → city + country fallback.
 */
function buildAddressString(props: PhotonFeature['properties']): string {
  const parts: string[] = []

  // Best case: structured address
  if (props.housenumber && props.street) {
    parts.push(`${props.housenumber} ${props.street}`)
  } else if (props.street) {
    parts.push(props.street)
  } else if (props.name) {
    parts.push(props.name)
  }

  // City
  if (props.city) parts.push(props.city)
  else if (props.district) parts.push(props.district)
  else if (props.county) parts.push(props.county)

  // Country
  if (props.country) parts.push(props.country)

  return parts.join(', ') || 'Unknown address'
}

/**
 * Maps a single Photon GeoJSON feature to our internal AddressSuggestion type.
 */
function featureToSuggestion(feature: PhotonFeature): AddressSuggestion {
  const { properties, geometry } = feature

  return {
    address: buildAddressString(properties),
    latitude: geometry.coordinates[1], // GeoJSON is [lng, lat]
    longitude: geometry.coordinates[0],
    city: properties.city,
    state: properties.state,
    country: properties.country,
    postcode: properties.postcode,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Search for addresses using the Photon geocoding API.
 *
 * Results are cached in-memory for 5 minutes to avoid redundant API calls.
 *
 * @param query  - The search string (e.g. "Christchurch").
 * @param signal - Optional AbortSignal to cancel the request.
 * @param limit  - Max results (default 5).
 * @returns A promise resolving to an array of address suggestions.
 *
 * @throws {Error} On network failure, non-OK response, or invalid response shape.
 */
export async function searchPhoton(
  query: string,
  signal?: AbortSignal,
  limit: number = DEFAULT_LIMIT,
): Promise<AddressSuggestion[]> {
  // Check cache first
  const cached = getCached(query)
  if (cached) return cached

  // Build URL
  const url = new URL(PHOTON_BASE_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('limit', String(limit))

  // Fetch
  let response: Response
  try {
    response = await fetch(url.toString(), { signal })
  } catch (err) {
    // AbortError is expected — re-throw so the hook can handle it
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new Error(`Network error while searching addresses: ${String(err)}`)
  }

  if (!response.ok) {
    throw new Error(
      `Photon API returned ${response.status}: ${response.statusText}`,
    )
  }

  // Parse
  let body: PhotonResponse
  try {
    body = await response.json()
  } catch {
    throw new Error('Photon API returned invalid JSON')
  }

  if (!body || !Array.isArray(body.features)) {
    throw new Error('Photon API returned an unexpected response shape')
  }

  // Map to suggestions
  const suggestions = body.features.map(featureToSuggestion)

  // Cache
  setCached(query, suggestions)

  return suggestions
}
