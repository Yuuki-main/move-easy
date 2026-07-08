/**
 * Barrel export for the maps component system.
 *
 * Usage:
 * ```tsx
 * import { LeafletMap, PickupMarker, DeliveryMarker } from '@/components/maps'
 * import type { Location, MapMarker } from '@/types/maps'
 * ```
 *
 * @module components/maps
 */

export { default as LeafletMap } from './LeafletMap'
export { default as MapMarker } from './MapMarker'
export { default as PickupMarker } from './PickupMarker'
export { default as DeliveryMarker } from './DeliveryMarker'
