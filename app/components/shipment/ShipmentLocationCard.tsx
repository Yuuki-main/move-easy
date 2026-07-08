/**
 * `<ShipmentLocationCard />` — Displays a single location (pickup or delivery)
 * with a coloured icon and the full address string.
 *
 * Pure presentational — no API calls, no state.
 *
 * @module components/shipment/ShipmentLocationCard
 */

import { memo } from 'react'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShipmentLocationCardProps {
  /**
   * Label shown above the address (e.g. "Pickup" or "Delivery").
   */
  label: string

  /**
   * Full address string (from database).
   */
  address: string

  /**
   * Visual variant — controls the colour of the icon and accent.
   *
   * - `'pickup'` → green
   * - `'delivery'` → red
   */
  variant: 'pickup' | 'delivery'

  /** Extra CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function PickupIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    </span>
  )
}

function DeliveryIcon() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShipmentLocationCard = memo(function ShipmentLocationCard({
  label,
  address,
  variant,
  className = '',
}: ShipmentLocationCardProps) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 ${className}`}
    >
      {variant === 'pickup' ? <PickupIcon /> : <DeliveryIcon />}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-medium text-gray-800 leading-snug break-words">
          {address || '—'}
        </p>
      </div>
    </div>
  )
})

export default ShipmentLocationCard
