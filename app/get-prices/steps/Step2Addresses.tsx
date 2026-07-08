'use client'

import { useMemo, useCallback } from 'react'
import { AddressAutocomplete } from '@/components/address'
import { LeafletMap } from '@/components/maps'
import type { AddressSuggestion } from '@/types/address'
import type { Location } from '@/types/maps'

const FLOOR_OPTIONS = [
  'Basement', 'Ground floor', '1st floor', '2nd floor', '3rd floor',
  '4th floor', '5th floor', '6th floor', '7th floor', '8th floor',
  '9th floor', 'Above 9th floor',
]

const LOADING_OPTIONS = [
  'Requires 1 person to load',
  'Requires 2 people to load',
  'Requires 3+ people to load',
]

const UNLOADING_OPTIONS = [
  'Requires 1 person to unload',
  'Requires 2 people to unload',
  'Requires 3+ people to unload',
]

const DATE_TYPES = [
  { value: 'flexible', label: 'Flexible' },
  { value: 'asap', label: 'ASAP' },
  { value: 'specific', label: 'Specific date' },
  { value: 'between', label: 'Between dates' },
]

export default function Step2Addresses({ wizard }) {
  const { state, update, nextStep, prevStep } = wizard

  // ── Derived: Location objects for the map ──────────────────────────
  const pickupLocation: Location | null = useMemo(() => {
    if (state.pickupLat == null || state.pickupLng == null) return null
    return {
      address: state.pickupAddress,
      latitude: state.pickupLat,
      longitude: state.pickupLng,
      city: state.pickupCity || undefined,
      state: state.pickupState || undefined,
      country: state.pickupCountry || undefined,
      postcode: state.pickupPostcode || undefined,
    }
  }, [state.pickupAddress, state.pickupLat, state.pickupLng, state.pickupCity, state.pickupState, state.pickupCountry, state.pickupPostcode])

  const deliveryLocation: Location | null = useMemo(() => {
    if (state.deliveryLat == null || state.deliveryLng == null) return null
    return {
      address: state.deliveryAddress,
      latitude: state.deliveryLat,
      longitude: state.deliveryLng,
      city: state.deliveryCity || undefined,
      state: state.deliveryState || undefined,
      country: state.deliveryCountry || undefined,
      postcode: state.deliveryPostcode || undefined,
    }
  }, [state.deliveryAddress, state.deliveryLat, state.deliveryLng, state.deliveryCity, state.deliveryState, state.deliveryCountry, state.deliveryPostcode])

  // ── Validation: must have selected valid coordinates ────────────────
  const canContinue =
    state.pickupLat != null && state.pickupLng != null &&
    state.deliveryLat != null && state.deliveryLng != null

  // ── Handlers ───────────────────────────────────────────────────────
  const handlePickupSelect = useCallback((s: AddressSuggestion) => {
    update({
      pickupAddress: s.address,
      pickupLat: s.latitude,
      pickupLng: s.longitude,
      pickupCity: s.city || '',
      pickupState: s.state || '',
      pickupCountry: s.country || '',
      pickupPostcode: s.postcode || '',
    })
  }, [update])

  const handlePickupChange = useCallback((val: string) => {
    update({ pickupAddress: val })
  }, [update])

  const handleDeliverySelect = useCallback((s: AddressSuggestion) => {
    update({
      deliveryAddress: s.address,
      deliveryLat: s.latitude,
      deliveryLng: s.longitude,
      deliveryCity: s.city || '',
      deliveryState: s.state || '',
      deliveryCountry: s.country || '',
      deliveryPostcode: s.postcode || '',
    })
  }, [update])

  const handleDeliveryChange = useCallback((val: string) => {
    update({ deliveryAddress: val })
  }, [update])

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Back button */}
      <button
        type="button"
        onClick={prevStep}
        className="mb-6 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Where is the move?</h2>
      <p className="text-sm text-gray-500 mb-8">Enter pickup and delivery locations.</p>

      <div className="space-y-5">
        {/* ── Map preview ────────────────────────────────────────── */}
        <LeafletMap
          pickup={pickupLocation}
          delivery={deliveryLocation}
          height="220px"
          interactive={false}
          showZoomControl={false}
        />

        {/* ── Pickup Address ─────────────────────────────────────── */}
        <AddressAutocomplete
          label="Pickup address"
          value={state.pickupAddress}
          onChange={handlePickupChange}
          onSelect={handlePickupSelect}
          placeholder="Where should the mover collect from?"
          required
        />

        {/* Floor + Loading side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Collection floor level
            </label>
            <select
              value={state.pickupFloor}
              onChange={(e) => update({ pickupFloor: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {FLOOR_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Item loading
            </label>
            <select
              value={state.itemLoading}
              onChange={(e) => update({ itemLoading: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {LOADING_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Delivery Address ───────────────────────────────────── */}
        <AddressAutocomplete
          label="Delivery address"
          value={state.deliveryAddress}
          onChange={handleDeliveryChange}
          onSelect={handleDeliverySelect}
          placeholder="Where should the mover deliver to?"
          required
        />

        {/* Floor + Unloading side-by-side */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Delivery floor level
            </label>
            <select
              value={state.deliveryFloor}
              onChange={(e) => update({ deliveryFloor: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {FLOOR_OPTIONS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Item unloading
            </label>
            <select
              value={state.itemUnloading}
              onChange={(e) => update({ itemUnloading: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {UNLOADING_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Move date type selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            When do you need to move?
          </label>
          <div className="flex gap-1.5">
            {DATE_TYPES.map((dt) => (
              <button
                key={dt.value}
                type="button"
                onClick={() => update({ moveDateType: dt.value })}
                className={
                  `flex-1 rounded-lg border px-3 py-2 text-xs font-medium text-center transition-colors cursor-pointer ` +
                  (state.moveDateType === dt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300')
                }
              >
                {dt.label}
              </button>
            ))}
          </div>

          {state.moveDateType === 'specific' && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Move date</label>
              <input
                type="date"
                value={state.moveDateFrom}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => update({ moveDateFrom: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {state.moveDateType === 'between' && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">From</label>
                <input
                  type="date"
                  value={state.moveDateFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => update({ moveDateFrom: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">To</label>
                <input
                  type="date"
                  value={state.moveDateTo}
                  min={state.moveDateFrom || new Date().toISOString().split('T')[0]}
                  onChange={(e) => update({ moveDateTo: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Continue button ────────────────────────────────────────── */}
      <button
        type="button"
        onClick={nextStep}
        disabled={!canContinue}
        className="mt-10 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}
