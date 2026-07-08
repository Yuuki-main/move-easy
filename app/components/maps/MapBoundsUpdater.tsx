/**
 * `<MapBoundsUpdater />` — Automatically fits the map to show pickup
 * and delivery markers with smooth animation.
 *
 * Must be rendered as a **child of `<MapContainer />`** (from react-leaflet)
 * because it calls `useMap()`.
 *
 * ## Behaviour
 *
 * | Pickup | Delivery | Action |
 * |--------|----------|--------|
 * | ❌      | ❌       | Nothing — map stays at default centre |
 * | ✅      | ❌       | Fly to pickup with zoom 13 |
 * | ❌      | ✅       | Fly to delivery with zoom 13 |
 * | ✅      | ✅       | Fit bounds around both markers with 60 px padding |
 *
 * @module components/maps/MapBoundsUpdater
 */

'use client'

import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Location } from '@/types/maps'
import { isValidLatLng } from '@/types/maps'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface MapBoundsUpdaterProps {
  pickup: Location | null | undefined
  delivery: Location | null | undefined
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Zoom level used when flying to a single marker. */
const SINGLE_MARKER_ZOOM = 13

/** Padding (in pixels) when fitting bounds around two markers. */
const BOUNDS_PADDING: L.PointTuple = [60, 60]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Converts a Location to a Leaflet LatLngExpression, or null if invalid. */
function toLatLng(loc: Location | null | undefined): L.LatLngExpression | null {
  if (!loc) return null
  if (!isValidLatLng({ lat: loc.latitude, lng: loc.longitude })) return null
  return [loc.latitude, loc.longitude] as L.LatLngExpression
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Watches `pickup` and `delivery` props and adjusts the map viewport.
 *
 * Uses `useRef` to track previous locations so we only animate when
 * something actually changes (prevents loops from map drag → state update).
 */
function MapBoundsUpdater({ pickup, delivery }: MapBoundsUpdaterProps) {
  const map = useMap()
  const prevRef = useRef<string>('')

  useEffect(() => {
    const pickupLatLng = toLatLng(pickup)
    const deliveryLatLng = toLatLng(delivery)

    // Build a stable key so we skip duplicate updates
    const key = [
      pickupLatLng?.toString() ?? '',
      deliveryLatLng?.toString() ?? '',
    ].join('|')

    if (key === prevRef.current) return
    prevRef.current = key

    // Case 1: Both locations → fit bounds
    if (pickupLatLng && deliveryLatLng) {
      const bounds = L.latLngBounds([pickupLatLng, deliveryLatLng])
      map.fitBounds(bounds, { padding: BOUNDS_PADDING, animate: true })
      return
    }

    // Case 2: Only pickup
    if (pickupLatLng) {
      map.flyTo(pickupLatLng, SINGLE_MARKER_ZOOM, { animate: true, duration: 0.8 })
      return
    }

    // Case 3: Only delivery
    if (deliveryLatLng) {
      map.flyTo(deliveryLatLng, SINGLE_MARKER_ZOOM, { animate: true, duration: 0.8 })
      return
    }

    // Case 4: Neither — do nothing (map stays at default)
  }, [pickup, delivery, map])

  // This component renders nothing — it only calls side effects
  return null
}

export default MapBoundsUpdater
