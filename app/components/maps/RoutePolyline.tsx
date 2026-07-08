/**
 * `<RoutePolyline />` — Renders a driving route polyline on a Leaflet map.
 *
 * Must be rendered as a child of `<MapContainer />` (from react-leaflet).
 *
 * ## Customisation
 *
 * All visual properties are exposed as props with sensible defaults.
 * Colours, weight, and opacity can be changed without touching this file.
 *
 * @module components/maps/RoutePolyline
 */

'use client'

import { memo, useMemo } from 'react'
import { Polyline } from 'react-leaflet'
import type { RouteData } from '@/types/routing'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RoutePolylineProps {
  /** Route data (coordinates, distance, duration). */
  route: RouteData

  /**
   * Polyline colour. Accepts any valid CSS colour.
   *
   * @default '#2563eb' (blue-600)
   */
  routeColor?: string

  /**
   * Polyline stroke weight in pixels.
   *
   * @default 5
   */
  routeWeight?: number

  /**
   * Polyline opacity.
   *
   * @default 0.8
   */
  routeOpacity?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a Leaflet `<Polyline>` for a driving route.
 *
 * Coordinates are transformed from `[lng, lat]` (GeoJSON) to `[lat, lng]`
 * (Leaflet) via `useMemo` to avoid recalculating on every render.
 */
const RoutePolyline = memo(function RoutePolyline({
  route,
  routeColor = '#2563eb',
  routeWeight = 5,
  routeOpacity = 0.8,
}: RoutePolylineProps) {
  // Transform [lng, lat] → [lat, lng] for Leaflet
  const leafletCoords: [number, number][] = useMemo(
    () => route.coordinates.map(([lng, lat]) => [lat, lng]),
    [route.coordinates],
  )

  return (
    <Polyline
      positions={leafletCoords}
      pathOptions={{
        color: routeColor,
        weight: routeWeight,
        opacity: routeOpacity,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  )
})

export default RoutePolyline
