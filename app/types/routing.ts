/**
 * Route-related TypeScript interfaces.
 *
 * Central type definitions for the routing system.
 * Every route component, hook, and utility consumes these types.
 *
 * @module types/route
 */

// ---------------------------------------------------------------------------
// Route data (returned by ORS API + consumed by components)
// ---------------------------------------------------------------------------

/**
 * A fully-resolved route between pickup and delivery.
 *
 * Contains the polyline coordinates and the distance / duration summary.
 */
export interface RouteData {
  /** Array of [longitude, latitude] pairs defining the route path. */
  coordinates: [number, number][]

  /** Total route distance in metres. */
  distanceMeters: number

  /** Total estimated travel time in seconds. */
  durationSeconds: number
}

// ---------------------------------------------------------------------------
// OpenRouteService API shapes (internal)
// ---------------------------------------------------------------------------

/**
 * Raw ORS Directions API response (subset of fields we care about).
 *
 * @internal
 * @see https://openrouteservice.org/dev/#/api-docs/v2/directions/{profile}/post
 */
export interface OrsDirectionsResponse {
  routes: Array<{
    summary: {
      distance: number // metres
      duration: number // seconds
    }
    geometry: {
      coordinates: [number, number][] // [[lng, lat], ...]
    }
  }>
}

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

/** Configuration options for the `useRoute` hook. */
export interface UseRouteOptions {
  /**
   * OpenRouteService API key.
   *
   * Defaults to `NEXT_PUBLIC_ORS_API_KEY` from environment.
   * Override for testing or custom providers.
   */
  apiKey?: string

  /**
   * ORS Directions API base URL.
   *
   * @default 'https://api.openrouteservice.org/v2/directions/driving-car'
   */
  apiUrl?: string
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a distance in metres to a human-readable string.
 *
 * @example formatDistance(928000) → '928 km'
 * @example formatDistance(450) → '450 m'
 */
export function formatDistance(metres: number): string {
  if (metres >= 1000) {
    const km = metres / 1000
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`
  }
  return `${Math.round(metres)} m`
}

/**
 * Formats a duration in seconds to a human-readable string.
 *
 * @example formatDuration(51120) → '14 hrs 12 mins'
 * @example formatDuration(540) → '9 mins'
 * @example formatDuration(45) → '< 1 min'
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return '< 1 min'

  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (hrs > 0) {
    return mins > 0 ? `${hrs} hr${hrs > 1 ? 's' : ''} ${mins} min${mins > 1 ? 's' : ''}` : `${hrs} hr${hrs > 1 ? 's' : ''}`
  }

  return `${mins} min${mins > 1 ? 's' : ''}`
}
