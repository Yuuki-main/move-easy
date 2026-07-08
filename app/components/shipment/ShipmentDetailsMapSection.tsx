/**
 * `<ShipmentDetailsMapSection />` — Full shipment details map experience.
 *
 * Composes:
 * - `<ShipmentMap />` — the interactive / read-only map
 * - `<ShipmentLocationCard />` × 2 — pickup + delivery addresses
 * - `<ShipmentRouteSummary />` — distance + duration badges
 *
 * ## Usage
 * ```tsx
 * <ShipmentDetailsMapSection
 *   pickupAddress={job.pickup_address}
 *   pickupLat={job.pickup_lat}
 *   pickupLng={job.pickup_lng}
 *   deliveryAddress={job.delivery_address}
 *   deliveryLat={job.delivery_lat}
 *   deliveryLng={job.delivery_lng}
 *   distanceMeters={job.route_distance}
 *   durationSeconds={job.route_duration}
 *   showRoute
 *   interactive
 * />
 * ```
 *
 * @module components/shipment/ShipmentDetailsMapSection
 */

'use client'

import { memo } from 'react'
import ShipmentMap from './ShipmentMap'
import ShipmentLocationCard from './ShipmentLocationCard'
import ShipmentRouteSummary from './ShipmentRouteSummary'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShipmentDetailsMapSectionProps {
  // --- Pickup ---
  pickupAddress: string
  pickupLat: number
  pickupLng: number

  // --- Delivery ---
  deliveryAddress: string
  deliveryLat: number
  deliveryLng: number

  // --- Route ---
  /** Total route distance in metres (from database). */
  distanceMeters?: number | null

  /** Estimated travel time in seconds (from database). */
  durationSeconds?: number | null

  /** Whether to fetch and display the route polyline on the map. */
  showRoute?: boolean

  /** Whether the map is interactive. @default true */
  interactive?: boolean

  /** Map height. @default '400px' */
  mapHeight?: string

  /** Extra CSS classes for the outer container. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders the complete shipment details map section:
 * a map with pickup/delivery markers, location cards, and route summary.
 *
 * All data comes from props — **zero API calls** are made by this component.
 * The parent page is responsible for fetching data from Supabase and
 * passing it down.
 */
const ShipmentDetailsMapSection = memo(function ShipmentDetailsMapSection({
  pickupAddress,
  pickupLat,
  pickupLng,
  deliveryAddress,
  deliveryLat,
  deliveryLng,
  distanceMeters,
  durationSeconds,
  showRoute = false,
  interactive = true,
  mapHeight = '400px',
  className = '',
}: ShipmentDetailsMapSectionProps) {
  return (
    <section className={`space-y-4 ${className}`}>
      {/* Map */}
      <ShipmentMap
        pickupAddress={pickupAddress}
        pickupLat={pickupLat}
        pickupLng={pickupLng}
        deliveryAddress={deliveryAddress}
        deliveryLat={deliveryLat}
        deliveryLng={deliveryLng}
        showRoute={showRoute}
        interactive={interactive}
        height={mapHeight}
      />

      {/* Location cards — side by side on tablet+ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ShipmentLocationCard
          label="Pickup"
          address={pickupAddress}
          variant="pickup"
        />

        <ShipmentLocationCard
          label="Delivery"
          address={deliveryAddress}
          variant="delivery"
        />
      </div>

      {/* Route summary (distance + duration) */}
      <ShipmentRouteSummary
        distanceMeters={distanceMeters}
        durationSeconds={durationSeconds}
      />
    </section>
  )
})

export default ShipmentDetailsMapSection
