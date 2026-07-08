/**
 * LeafletMapInner — The actual Leaflet renderer.
 *
 * This file is NEVER imported directly by server components.
 * It is only loaded via `next/dynamic` with `ssr: false` from `LeafletMap.tsx`.
 *
 * It imports Leaflet CSS and all browser-only `react-leaflet` components,
 * which would throw `window is not defined` if executed on the server.
 *
 * @module components/maps/LeafletMapInner
 * @internal — do not import directly; use `<LeafletMap />` instead
 */

'use client'

import { memo } from 'react'
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet'
import type { MapMarker as MapMarkerType, Location } from '@/types/maps'
import type { LatLng } from '@/types/maps'
import MapMarker from './MapMarker'
import PickupMarker from './PickupMarker'
import DeliveryMarker from './DeliveryMarker'
import RoutePolyline from './RoutePolyline'
import RouteSummary from './RouteSummary'
import MapBoundsUpdater from './MapBoundsUpdater'
import { useRoute } from '@/hooks/useRoute'
import { OSM_TILE_URL, OSM_ATTRIBUTION } from '@/lib/maps/leaflet'

// ---------------------------------------------------------------------------
// Leaflet CSS — must be imported in the browser
// ---------------------------------------------------------------------------

import 'leaflet/dist/leaflet.css'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LeafletMapInnerProps {
  center: LatLng
  zoom: number
  markers: MapMarkerType[]
  pickup: Location | null
  delivery: Location | null
  showRoute: boolean
  showDistance: boolean
  showDuration: boolean
  showZoomControl: boolean
  scrollWheelZoom: boolean
  interactive: boolean
}

// ---------------------------------------------------------------------------
// Fix Leaflet default icon path issue
// ---------------------------------------------------------------------------

import L from 'leaflet'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

// @ts-ignore — Leaflet's _getIconUrl is not in the public types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(L.Icon.Default.prototype as any)._getIconUrl = undefined

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

// ---------------------------------------------------------------------------
// Inner component that uses the route hook
// ---------------------------------------------------------------------------

/**
 * Split into its own component so `useRoute` is only called when
 * `showRoute` is true. This avoids unnecessary hook initialisation
 * for maps that don't need routing.
 */
function MapWithRoute({
  pickup,
  delivery,
  showDistance,
  showDuration,
  children,
}: {
  pickup: Location | null
  delivery: Location | null
  showDistance: boolean
  showDuration: boolean
  children: React.ReactNode
}) {
  const { route } = useRoute(pickup, delivery)

  return (
    <>
      {children}

      {/* Route polyline */}
      {route ? <RoutePolyline route={route} /> : null}

      {/* Distance / Duration overlay */}
      {route ? (
        <div className="absolute bottom-3 left-3 z-[1000]">
          <RouteSummary
            route={route}
            showDistance={showDistance}
            showDuration={showDuration}
          />
        </div>
      ) : null}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const LeafletMapInner = memo(function LeafletMapInner({
  center,
  zoom,
  markers,
  pickup,
  delivery,
  showRoute,
  showDistance,
  showDuration,
  showZoomControl,
  scrollWheelZoom,
  interactive,
}: LeafletMapInnerProps) {
  const mapChildren = (
    <>
      {/* OpenStreetMap tile layer */}
      <TileLayer
        attribution={OSM_ATTRIBUTION}
        url={OSM_TILE_URL}
      />

      {/* Conditional zoom control */}
      {showZoomControl ? <ZoomControl position="bottomright" /> : null}

      {/* Generic markers (backward-compatible `markers` prop) */}
      {markers.map((marker) => (
        <MapMarker key={marker.id} marker={marker} />
      ))}

      {/* Pickup pin */}
      {pickup ? <PickupMarker location={pickup} /> : null}

      {/* Delivery pin */}
      {delivery ? <DeliveryMarker location={delivery} /> : null}

      {/* Auto-fit bounds when locations change */}
      <MapBoundsUpdater pickup={pickup} delivery={delivery} />
    </>
  )

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      zoomControl={false}
      dragging={interactive}
      touchZoom={interactive}
      doubleClickZoom={interactive}
      keyboard={interactive}
      className="h-full w-full rounded-xl z-0"
    >
      {showRoute ? (
        <MapWithRoute
          pickup={pickup}
          delivery={delivery}
          showDistance={showDistance}
          showDuration={showDuration}
        >
          {mapChildren}
        </MapWithRoute>
      ) : (
        mapChildren
      )}
    </MapContainer>
  )
})

export default LeafletMapInner
