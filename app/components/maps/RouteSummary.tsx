/**
 * `<RouteSummary />` — Displays route distance and estimated duration
 * in a compact, human-readable format.
 *
 * Renders nothing if no route data is provided.
 *
 * @module components/maps/RouteSummary
 */

'use client'

import { memo, useMemo } from 'react'
import type { RouteData } from '@/types/routing'
import { formatDistance, formatDuration } from '@/types/routing'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface RouteSummaryProps {
  /** Route data. */
  route: RouteData | null

  /** Whether to show the distance row. @default true */
  showDistance?: boolean

  /** Whether to show the duration row. @default true */
  showDuration?: boolean

  /** Extra CSS classes for the outer container. */
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Renders a distance + duration summary card.
 *
 * Memoised to prevent re-renders when the parent map re-renders
 * but the route data hasn't changed.
 */
const RouteSummary = memo(function RouteSummary({
  route,
  showDistance = true,
  showDuration = true,
  className = '',
}: RouteSummaryProps) {
  const distance = useMemo(
    () => (route ? formatDistance(route.distanceMeters) : null),
    [route],
  )
  const duration = useMemo(
    () => (route ? formatDuration(route.durationSeconds) : null),
    [route],
  )

  if (!route) return null
  if (!showDistance && !showDuration) return null

  return (
    <div
      className={`flex items-center gap-4 rounded-xl bg-white/90 px-4 py-2.5 text-sm shadow backdrop-blur ${className}`}
    >
      {showDistance && distance && (
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
          <span className="font-semibold text-gray-800">{distance}</span>
        </div>
      )}

      {showDuration && duration && (
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
          <span className="font-semibold text-gray-800">{duration}</span>
        </div>
      )}
    </div>
  )
})

export default RouteSummary
