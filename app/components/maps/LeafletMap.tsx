/**
 * `<LeafletMap />` — Production-ready Leaflet map component.
 *
 * ## Usage
 *
 * ```tsx
 * <LeafletMap
 *   center={{ lat: -43.532, lng: 172.636 }}
 *   zoom={11}
 *   markers={[{ id: 'pickup', position: { lat: -43.532, lng: 172.636 } }]}
 * />
 * ```
 *
 * ## Features
 *
 * - Works with Next.js App Router (avoids hydration errors via dynamic import)
 * - Gracefully handles invalid coordinates and empty marker arrays
 * - Memoized to prevent unnecessary re-renders
 * - Responsive — fills parent container
 * - Uses OpenStreetMap tiles with proper attribution
 * - Keyboard-accessible (Leaflet's built-in keyboard support)
 *
 * @module components/maps/LeafletMap
 */

'use client'

import { memo, useMemo } from 'react'
import type { LeafletMapProps } from '@/types/maps'
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '@/types/maps'
import { filterValidMarkers, sanitizeCenter, sanitizeZoom } from '@/lib/maps/leaflet'

// ---------------------------------------------------------------------------
// Dynamic import — avoids SSR
// ---------------------------------------------------------------------------

import dynamic from 'next/dynamic'

/**
 * The actual Leaflet renderer is loaded dynamically with `ssr: false`.
 * This prevents the `window is not defined` error during server-side
 * rendering, which is the #1 cause of Leaflet hydration failures in Next.js.
 */
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => <MapSkeleton />,
})

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

/**
 * Placeholder shown while the Leaflet bundle loads.
 *
 * Matches the map container dimensions so there is no layout shift
 * once the real map replaces it.
 */
function MapSkeleton() {
  return (
    <div className="h-full w-full rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
      <span className="text-sm text-gray-400">Loading map…</span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

/**
 * Renders an interactive OpenStreetMap via Leaflet.
 *
 * All props are optional — sensible defaults are applied:
 * - Default centre: geographic centre of New Zealand (-40.90°S, 174.89°E)
 * - Default zoom: 5
 * - Default height: 100% (fills parent)
 *
 * Invalid markers (bad coordinates) are silently filtered out.
 */
const LeafletMap = memo(function LeafletMap(props: LeafletMapProps) {
  const {
    center,
    zoom,
    height = '100%',
    markers = [],
    pickup,
    delivery,
    showRoute = false,
    showDistance = true,
    showDuration = true,
    className = '',
    showZoomControl = true,
    scrollWheelZoom = true,
    interactive = true,
  } = props

  const safeCenter = useMemo(() => sanitizeCenter(center), [center])
  const safeZoom = useMemo(() => sanitizeZoom(zoom), [zoom])
  const safeMarkers = useMemo(() => filterValidMarkers(markers), [markers])

  // Stabilise pickup / delivery references to prevent inner re-renders
  const stablePickup = useMemo(() => pickup ?? null, [pickup])
  const stableDelivery = useMemo(() => delivery ?? null, [delivery])

  return (
    <div
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ height }}
      role="region"
      aria-label="Interactive map"
    >
      <LeafletMapInner
        center={safeCenter}
        zoom={safeZoom}
        markers={safeMarkers}
        pickup={stablePickup}
        delivery={stableDelivery}
        showRoute={showRoute}
        showDistance={showDistance}
        showDuration={showDuration}
        showZoomControl={showZoomControl}
        scrollWheelZoom={scrollWheelZoom}
        interactive={interactive}
      />
    </div>
  )
})

export default LeafletMap
