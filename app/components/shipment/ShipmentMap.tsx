/**
 * `<ShipmentMap />` — Pre-configured map for shipment detail views.
 *
 * Wraps `<LeafletMap />` and maps raw database fields
 * (`pickup_address`, `pickup_lat`, etc.) into the `Location` shape
 * expected by the map system.
 *
 * ## Key behaviour
 * - **Zero API calls** — everything is driven by props.
 * - Renders pickup (green) and delivery (red) markers.
 * - Auto-fits bounds to show both markers.
 * - Optionally shows the driving route polyline.
 * - Supports `interactive={false}` for read-only views.
 *
 * ## Usage
 * ```tsx
 * <ShipmentMap
 *   pickupAddress="123 Main St"
 *   pickupLat={-43.532}
 *   pickupLng={172.636}
 *   deliveryAddress="456 High St"
 *   deliveryLat={-43.522}
 *   deliveryLng={172.626}
 *   showRoute
 * />
 * ```
 *
 * @module components/shipment/ShipmentMap
 */

'use client'

import { memo, useMemo } from 'react'
import { LeafletMap } from '@/components/maps'
import type { Location } from '@/types/maps'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShipmentMapProps {
  /** Pickup address string (from database). */
  pickupAddress: string

  /** Pickup latitude. */
  pickupLat: number

  /** Pickup longitude. */
  pickupLng: number

  /** Delivery address string (from database). */
  deliveryAddress: string

  /** Delivery latitude. */
  deliveryLat: number

  /** Delivery longitude. */
  deliveryLng: number

  /** Whether to fetch and display the driving route polyline. */
  showRoute?: boolean

  /**
   * Whether the map responds to user interaction.
   *
   * @default true
   */
  interactive?: boolean

  /** Map height (CSS value). @default '400px' */
  height?: string

  /** Extra CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts raw address + coordinate fields into the `Location` shape
 * consumed by `<LeafletMap />`.
 */
function toLocation(
  address: string,
  lat: number,
  lng: number,
): Location {
  return { address, latitude: lat, longitude: lng }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShipmentMap = memo(function ShipmentMap({
  pickupAddress,
  pickupLat,
  pickupLng,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  showRoute = false,
  interactive = true,
  height = '400px',
  className = '',
}: ShipmentMapProps) {
  const pickup = useMemo(
    () => toLocation(pickupAddress, pickupLat, pickupLng),
    [pickupAddress, pickupLat, pickupLng],
  )

  const delivery = useMemo(
    () => toLocation(deliveryAddress, deliveryLat, deliveryLng),
    [deliveryAddress, deliveryLat, deliveryLng],
  )

  return (
    <LeafletMap
      pickup={pickup}
      delivery={delivery}
      showRoute={showRoute}
      interactive={interactive}
      scrollWheelZoom={interactive}
      showZoomControl={interactive}
      height={height}
      className={className}
    />
  )
})

export default ShipmentMap
