/**
 * Map-related TypeScript interfaces.
 *
 * Central type definitions for the Leaflet map component system.
 * Every map component and utility consumes these types.
 *
 * @module types/maps
 */

// ---------------------------------------------------------------------------
// Coordinate types
// ---------------------------------------------------------------------------

/** A geographic coordinate (latitude/longitude) in decimal degrees. */
export interface LatLng {
  lat: number
  lng: number
}

/**
 * Validates that a LatLng object contains numeric values within
 * the Earth's valid latitude/longitude ranges.
 */
export function isValidLatLng(coord: LatLng): boolean {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    !Number.isNaN(coord.lat) &&
    !Number.isNaN(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  )
}

// ---------------------------------------------------------------------------
// Marker types
// ---------------------------------------------------------------------------

/**
 * A marker to be rendered on the map.
 *
 * Every marker must have a unique `id` and a `position`.
 * `popup` is optional — when provided, it renders a Leaflet popup
 * that opens when the marker is clicked.
 */
export interface MapMarker {
  /** Unique identifier (used as React `key`). */
  id: string

  /** Geographic position of the marker. */
  position: LatLng

  /**
   * Optional popup content.
   *
   * Can be a plain string (rendered as-is) or a more complex value.
   * Later phases may support React nodes for rich popup content.
   */
  popup?: string
}

// ---------------------------------------------------------------------------
// Location (shared between address autocomplete + map)
// ---------------------------------------------------------------------------

/**
 * A fully-resolved geographic location.
 *
 * Used by both the address autocomplete system (as output of Photon API)
 * and the map system (as pickup / delivery waypoints).
 */
export interface Location {
  /** Full formatted address. */
  address: string

  /** Latitude in decimal degrees. */
  latitude: number

  /** Longitude in decimal degrees. */
  longitude: number

  /** City / locality (optional). */
  city?: string

  /** State / region (optional). */
  state?: string

  /** Country (optional). */
  country?: string

  /** Postal code (optional). */
  postcode?: string
}

// ---------------------------------------------------------------------------
// Map component props
// ---------------------------------------------------------------------------

/**
 * Props accepted by the `<LeafletMap />` component.
 *
 * All props are optional. Sensible defaults are provided for every value.
 */
export interface LeafletMapProps {
  /**
   * Center of the map.
   *
   * @default { lat: 20.5937, lng: 78.9629 } — geographic centre of India
   */
  center?: LatLng

  /**
   * Initial zoom level.
   *
   * @default 5
   */
  zoom?: number

  /**
   * Height of the map container. Accepts any valid CSS value.
   *
   * @default '100%'
   */
  height?: string

  /**
   * Array of markers to render on the map.
   *
   * Markers with invalid coordinates are silently skipped.
   *
   * @default []
   */
  markers?: MapMarker[]

  /**
   * Pickup location. When provided, a green pickup pin is placed
   * and the map pans to include it.
   */
  pickup?: Location | null

  /**
   * Delivery location. When provided, a red delivery pin is placed
   * and the map pans to include it.
   */
  delivery?: Location | null

  /**
   * Reserved for future route polyline support.
   * Pass `true` once routing is implemented.
   *
   * @default false
   */
  showRoute?: boolean

  /**
   * Show the route distance label on the map.
   *
   * @default true
   */
  showDistance?: boolean

  /**
   * Show the route duration label on the map.
   *
   * @default true
   */
  showDuration?: boolean

  /**
   * Optional additional CSS classes applied to the map container.
   */
  className?: string

  /**
   * Whether to show the zoom control (+/− buttons).
   *
   * @default true
   */
  showZoomControl?: boolean

  /**
   * Whether the user can zoom by scrolling the mouse wheel.
   *
   * @default true
   */
  scrollWheelZoom?: boolean

  /**
   * Whether the map responds to user interaction (dragging, clicking, etc.).
   * When `false`, the map is like a static image.
   *
   * @default true
   */
  interactive?: boolean
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default map center — approximate geographic centre of India. */
export const DEFAULT_CENTER: LatLng = {
  lat: 20.5937,
  lng: 78.9629,
}

/** Default zoom level. */
export const DEFAULT_ZOOM = 5
