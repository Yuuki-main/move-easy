/**
 * `<PickupMarker />` — Green pickup pin for Leaflet maps.
 *
 * Uses a custom `L.divIcon` with an inline SVG so no external icon
 * image is needed. The icon can be replaced later by swapping the SVG.
 *
 * @module components/maps/PickupMarker
 */

'use client'

import { memo, useMemo } from 'react'
import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { Location } from '@/types/maps'
import { isValidLatLng } from '@/types/maps'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PickupMarkerProps {
  /** Pickup location data. */
  location: Location
}

// ---------------------------------------------------------------------------
// Custom icon factory (memoized per module — same icon for all instances)
// ---------------------------------------------------------------------------

/**
 * Creates a green pickup pin divIcon.
 *
 * The inline SVG renders a filled pin shape with label "A".
 * Using `divIcon` (instead of `icon`) lets us style with Tailwind
 * and swap the SVG later without touching Leaflet icon URL machinery.
 */
function createPickupIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
            fill="#16a34a" stroke="#15803d" stroke-width="1.5"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
      <text x="16" y="19" text-anchor="middle" fill="#16a34a" font-size="10" font-weight="bold">A</text>
    </svg>`

  return L.divIcon({
    html: svg,
    className: '', // clear Leaflet's default white-bg styling
    iconSize: [32, 42],
    iconAnchor: [16, 42], // bottom centre of the pin
    popupAnchor: [0, -42],
  })
}

let _pickupIcon: L.DivIcon | null = null
function getPickupIcon(): L.DivIcon {
  if (!_pickupIcon) _pickupIcon = createPickupIcon()
  return _pickupIcon
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a green pickup marker at the given location.
 *
 * If the coordinates are invalid, nothing is rendered (no crash).
 */
const PickupMarker = memo(function PickupMarker({ location }: PickupMarkerProps) {
  const icon = useMemo(() => getPickupIcon(), [])

  if (!isValidLatLng({ lat: location.latitude, lng: location.longitude })) {
    return null
  }

  const popupText = [
    `📍 ${location.address}`,
    `Lat: ${location.latitude.toFixed(6)}`,
    `Lng: ${location.longitude.toFixed(6)}`,
  ].join('<br/>')

  return (
    <Marker
      position={[location.latitude, location.longitude]}
      icon={icon}
    >
      <Popup>
        <div
          className="text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: popupText }}
        />
      </Popup>
    </Marker>
  )
})

export default PickupMarker
