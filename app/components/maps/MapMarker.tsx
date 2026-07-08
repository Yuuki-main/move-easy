/**
 * `<MapMarker />` — Renders a single marker on a Leaflet map.
 *
 * Must be rendered as a child of `<MapContainer />` (from `react-leaflet`).
 * Supports optional popup text via the `popup` prop.
 *
 * Custom icons can be passed via the `icon` prop in a future phase.
 *
 * @module components/maps/MapMarker
 */

'use client'

import { memo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import type { MapMarker as MapMarkerType } from '@/types/maps'
import { isValidLatLng } from '@/types/maps'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

/** Props for the MapMarker component. */
interface MapMarkerProps {
  /** Marker data (position, id, optional popup). */
  marker: MapMarkerType
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a Leaflet marker at the given position.
 *
 * If the marker's coordinates are invalid the component gracefully renders
 * nothing (no crash, no console noise — just `null`).
 */
const MapMarkerComponent = memo(function MapMarker({ marker }: MapMarkerProps) {
  // Guard: skip markers with bad coordinates
  if (!isValidLatLng(marker.position)) return null

  return (
    <Marker position={[marker.position.lat, marker.position.lng]}>
      {marker.popup ? (
        <Popup>
          <span className="text-sm text-gray-800">{marker.popup}</span>
        </Popup>
      ) : null}
    </Marker>
  )
})

export default MapMarkerComponent
