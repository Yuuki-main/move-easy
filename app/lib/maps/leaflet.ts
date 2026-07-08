/**
 * Leaflet utility module — OpenStreetMap tile configuration,
 * default map options, and icon factory helpers.
 *
 * This module is safe to import on the server (no `window` access).
 * Only the components that render the map handle browser-side concerns.
 *
 * @module lib/maps/leaflet
 */

import type { LatLng, MapMarker } from '@/types/maps'
import { DEFAULT_CENTER, DEFAULT_ZOOM, isValidLatLng } from '@/types/maps'

// ---------------------------------------------------------------------------
// Tile layer — OpenStreetMap
// ---------------------------------------------------------------------------

/** OpenStreetMap tile URL template. */
export const OSM_TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

/**
 * Attribution text required by OpenStreetMap.
 * Must be displayed on every map using OSM tiles.
 */
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

// ---------------------------------------------------------------------------
// Default map centre / zoom
// ---------------------------------------------------------------------------

/** Re-exported from types for convenience. */
export { DEFAULT_CENTER, DEFAULT_ZOOM }

// ---------------------------------------------------------------------------
// Marker utilities
// ---------------------------------------------------------------------------

/**
 * Filters an array of markers, removing any with invalid coordinates.
 *
 * Invalid coordinates are those where `isValidLatLng` returns `false`.
 * The original array is not mutated — a new array is returned.
 */
export function filterValidMarkers(markers: MapMarker[]): MapMarker[] {
  return markers.filter((m) => isValidLatLng(m.position))
}

/**
 * Ensures the `center` prop is a valid LatLng.
 *
 * Returns the provided centre if valid, otherwise falls back to
 * `DEFAULT_CENTER`.
 */
export function sanitizeCenter(center?: LatLng): LatLng {
  if (center && isValidLatLng(center)) return center
  return DEFAULT_CENTER
}

/**
 * Ensures the `zoom` prop is a finite number within Leaflet's valid
 * zoom range (0–18).
 *
 * Returns the provided zoom if valid, otherwise `DEFAULT_ZOOM`.
 */
export function sanitizeZoom(zoom?: number): number {
  if (typeof zoom === 'number' && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18) {
    return zoom
  }
  return DEFAULT_ZOOM
}
