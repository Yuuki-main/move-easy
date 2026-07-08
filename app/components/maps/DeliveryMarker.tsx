/**
 * `<DeliveryMarker />` — Red delivery pin for Leaflet maps.
 *
 * Uses a custom `L.divIcon` with an inline SVG so no external icon
 * image is needed. The icon can be replaced later by swapping the SVG.
 *
 * @module components/maps/DeliveryMarker
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

interface DeliveryMarkerProps {
  /** Delivery location data. */
  location: Location
}

// ---------------------------------------------------------------------------
// Custom icon factory
// ---------------------------------------------------------------------------

/**
 * Creates a red delivery pin divIcon with label "B".
 *
 * Same shape as the pickup pin but coloured red (destructive/endpoint).
 * SVG is inlined so the icon can be hot-swapped without changing imports.
 */
function createDeliveryIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z"
            fill="#dc2626" stroke="#b91c1c" stroke-width="1.5"/>
      <circle cx="16" cy="15" r="6" fill="white"/>
      <text x="16" y="19" text-anchor="middle" fill="#dc2626" font-size="10" font-weight="bold">B</text>
    </svg>`

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  })
}

let _deliveryIcon: L.DivIcon | null = null
function getDeliveryIcon(): L.DivIcon {
  if (!_deliveryIcon) _deliveryIcon = createDeliveryIcon()
  return _deliveryIcon
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a red delivery marker at the given location.
 *
 * If the coordinates are invalid, nothing is rendered (no crash).
 */
const DeliveryMarker = memo(function DeliveryMarker({ location }: DeliveryMarkerProps) {
  const icon = useMemo(() => getDeliveryIcon(), [])

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

export default DeliveryMarker
