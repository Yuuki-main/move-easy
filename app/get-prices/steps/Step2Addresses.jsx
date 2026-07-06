'use client'

import AddressAutocomplete from '@/components/AddressAutocomplete'

const FLOOR_OPTIONS = [
  'Basement',
  'Ground floor',
  '1st floor',
  '2nd floor',
  '3rd floor',
  '4th floor',
  '5th floor',
  '6th floor',
  '7th floor',
  '8th floor',
  '9th floor',
  'Above 9th floor',
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

const DATE_TYPE_CLASS =
  'flex-1 rounded-lg border px-3 py-2 text-xs font-medium text-center transition-colors cursor-pointer'

export default function Step2Addresses({ wizard }) {
  const { state, update, nextStep, prevStep } = wizard

  const canContinue =
    Boolean(state.pickupAddress?.trim()) &&
    Boolean(state.deliveryAddress?.trim())

  return (
    <div>
      <button
        onClick={prevStep}
        className="mb-6 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Where is the move?
      </h2>

      <p className="text-sm text-gray-500 mb-8">
        Enter pickup and delivery locations.
      </p>

      <div className="space-y-5">
        {/* Pickup Address */}
        <AddressAutocomplete
          label="Pickup address"
          value={state.pickupAddress}
          onChange={(address, lat, lng) =>
            update({
              pickupAddress: address,
              pickupLat: lat,
              pickupLng: lng,
            })
          }
          placeholder="Where should the mover collect from?"
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
                <option key={f} value={f}>
                  {f}
                </option>
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
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Delivery Address */}
        <AddressAutocomplete
          label="Delivery address"
          value={state.deliveryAddress}
          onChange={(address, lat, lng) =>
            update({
              deliveryAddress: address,
              deliveryLat: lat,
              deliveryLng: lng,
            })
          }
          placeholder="Where should the mover deliver to?"
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
                <option key={f} value={f}>
                  {f}
                </option>
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
                <option key={o} value={o}>
                  {o}
                </option>
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
                  DATE_TYPE_CLASS +
                  (state.moveDateType === dt.value
                    ? ' border-blue-500 bg-blue-50 text-blue-700'
                    : ' border-gray-200 text-gray-500 hover:border-gray-300')
                }
              >
                {dt.label}
              </button>
            ))}
          </div>

          {/* Conditional date pickers */}
          {state.moveDateType === 'specific' && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Move date
              </label>
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
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  From
                </label>
                <input
                  type="date"
                  value={state.moveDateFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => update({ moveDateFrom: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  To
                </label>
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
