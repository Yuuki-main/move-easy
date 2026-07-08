/**
 * `<ShipmentRouteSummary />` — Displays the driving distance and estimated
 * duration between pickup and delivery as a compact row of badges.
 *
 * Accepts raw numeric values (from the database) and formats them
 * using the shared `formatDistance` / `formatDuration` utilities.
 *
 * Renders nothing if neither value is provided.
 *
 * @module components/shipment/ShipmentRouteSummary
 */

import { memo } from 'react'
import { formatDistance, formatDuration } from '@/types/routing'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ShipmentRouteSummaryProps {
  /** Total route distance in metres (from ORS or database). */
  distanceMeters?: number | null

  /** Estimated travel time in seconds (from ORS or database). */
  durationSeconds?: number | null

  /** Extra CSS classes. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ShipmentRouteSummary = memo(function ShipmentRouteSummary({
  distanceMeters,
  durationSeconds,
  className = '',
}: ShipmentRouteSummaryProps) {
  const hasDistance =
    typeof distanceMeters === 'number' && distanceMeters > 0
  const hasDuration =
    typeof durationSeconds === 'number' && durationSeconds > 0

  if (!hasDistance && !hasDuration) return null

  return (
    <div
      className={`flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 w-full sm:w-auto">
        Route
      </p>

      <div className="flex items-center gap-4">
        {hasDistance && (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-800">
              {formatDistance(distanceMeters!)}
            </span>
          </div>
        )}

        {hasDuration && (
          <div className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-semibold text-gray-800">
              {formatDuration(durationSeconds!)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

export default ShipmentRouteSummary
