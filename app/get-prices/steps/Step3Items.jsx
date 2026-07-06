'use client'

import { useState } from 'react'

export default function Step3Items({ wizard }) {
  const { state, update, nextStep, prevStep } = wizard

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
  })
  const [showItemForm, setShowItemForm] = useState(false)
  const [showSize, setShowSize] = useState(false)

  const addItem = () => {
    if (!newItem.name) return
    const item = { name: newItem.name, quantity: newItem.quantity }
    if (newItem.weight_kg) item.weight_kg = Number(newItem.weight_kg)
    if (showSize) {
      item.length_cm = Number(newItem.length_cm) || null
      item.width_cm = Number(newItem.width_cm) || null
      item.height_cm = Number(newItem.height_cm) || null
    }
    update({ items: [...state.items, item] })
    setNewItem({
      name: '',
      quantity: 1,
      weight_kg: '',
      length_cm: '',
      width_cm: '',
      height_cm: '',
    })
    setShowSize(false)
    setShowItemForm(false)
  }

  const removeItem = (index) => {
    update({ items: state.items.filter((_, idx) => idx !== index) })
  }

  const handlePhotos = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5)
    update({ photos: files })
  }

  return (
    <div>
      <button
        onClick={prevStep}
        className="mb-6 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">Item details</h2>
      <p className="text-sm text-gray-500 mb-8">More detail helps movers give accurate quotes.</p>

      {/* Items list */}
      {state.items.length > 0 && (
        <div className="mb-3 space-y-2">
          {state.items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                  {item.quantity}
                </span>
                <span className="font-medium text-gray-800">{item.name}</span>
              </div>
              <button
                onClick={() => removeItem(index)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {showItemForm ? (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
          <input
            autoFocus
            placeholder="Item name (e.g. sofa, washing machine)"
            value={newItem.name}
            onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">Quantity</label>
              <input
                type="number"
                min={1}
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                Weight kg (optional)
              </label>
              <input
                type="number"
                value={newItem.weight_kg}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, weight_kg: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Size checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSize}
              onChange={(e) => setShowSize(e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-gray-500">
              Can you specify a rough size? (Not required)
            </span>
          </label>

          {showSize && (
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Length (cm)
                </label>
                <input
                  type="number"
                  value={newItem.length_cm}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, length_cm: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Width (cm)
                </label>
                <input
                  type="number"
                  value={newItem.width_cm}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, width_cm: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={newItem.height_cm}
                  onChange={(e) =>
                    setNewItem((prev) => ({ ...prev, height_cm: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={addItem}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Add item
            </button>
            <button
              onClick={() => {
                setShowItemForm(false)
                setShowSize(false)
              }}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowItemForm(true)}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <span className="text-base leading-none">+</span>
          Add an item
        </button>
      )}

      {/* Photos */}
      <div className="mb-5">
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Photos{' '}
          <span className="font-normal text-gray-400">(up to 5, optional)</span>
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50">
          <span className="text-xl">📷</span>
          <span className="text-gray-500">
            {state.photos?.length > 0
              ? `${state.photos.length} photo(s) selected`
              : 'Upload photos'}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotos}
            className="sr-only"
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Notes for the mover{' '}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          placeholder="Access issues, fragile items, floor number, special requirements..."
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        onClick={nextStep}
        className="mt-6 w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700"
      >
        Review request
      </button>
    </div>
  )
}
