'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PAYMENT_OPTIONS = ['Cash', 'Bank Transfer', 'Card', 'UPI', 'Cheque']

const CATEGORY_OPTIONS = [
  { value: 'home_move', label: 'Home Move' },
  { value: 'office_move', label: 'Office Move' },
  { value: 'storage', label: 'Storage' },
  { value: 'car', label: 'Car Transport' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'boat', label: 'Boat' },
  { value: 'piano', label: 'Piano' },
  { value: 'pet', label: 'Pet Transport' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'junk', label: 'Junk Removal' },
  { value: 'other_vehicle', label: 'Other Vehicle' },
  { value: 'item', label: 'Parcel / Item' },
]

const CITY_OPTIONS = [
  'Auckland',
  'Wellington',
  'Christchurch',
  'Hamilton',
  'Tauranga',
  'Dunedin',
  'Palmerston North',
  'Napier',
  'Porirua',
  'New Plymouth',
  'Rotorua',
  'Whangārei',
  'Invercargill',
  'Whanganui',
  'Gisborne',
  'Lower Hutt',
  'Upper Hutt',
  'Nelson',
  'Blenheim',
  'Timaru',
  'Taupō',
  'Queenstown',
  'Wanaka',
  'Ashburton',
  'Rolleston',
  'Cambridge',
  'Pukekohe',
  'Papakura',
  'Paraparaumu',
  'Levin',
  'Masterton',
  'Feilding',
  'Tokoroa',
  'Oamaru',
  'Greymouth',
  'Hastings',
  'Richmond',
  'Kerikeri',
  'Te Awamutu',
  'Morrinsville',
  'Matamata',
  'Thames',
  'Kaitaia',
  'Whakatāne',
  'Cromwell',
]

function PillToggle({ options, selected, onChange, labelKey, valueKey }) {
  const toggle = (val) => {
    onChange(
      selected.includes(val)
        ? selected.filter((v) => v !== val)
        : [...selected, val],
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const val = valueKey ? opt[valueKey] : opt
        const label = labelKey ? opt[labelKey] : opt
        const active = selected.includes(val)
        return (
          <button
            key={val}
            type="button"
            onClick={() => toggle(val)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
              active
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

export default function CarrierProfileForm({ carrier }) {
  const router = useRouter()
  const [publicName, setPublicName] = useState(carrier?.public_name ?? '')
  const [description, setDescription] = useState(
    carrier?.profile_description ?? '',
  )
  const [paymentMethods, setPaymentMethods] = useState(
    carrier?.payment_methods ?? [],
  )
  const [serviceCategories, setServiceCategories] = useState(
    carrier?.service_categories ?? [],
  )
  const [serviceCities, setServiceCities] = useState(
    carrier?.service_cities ?? [],
  )
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const res = await fetch('/api/carriers/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        public_name: publicName,
        profile_description: description,
        payment_methods: paymentMethods,
        service_categories: serviceCategories,
        service_cities: serviceCities,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to save.')
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-8">
      {/* Success / error banners */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold px-4 py-3 rounded-xl">
          ✓ Profile updated successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Section 1 — Public profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-6">Public Profile</h2>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Public name
            </label>
            <input
              value={publicName}
              onChange={(e) => setPublicName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Your business or trading name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              placeholder="Tell customers about your service, experience, and what makes you stand out"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment methods
            </label>
            <PillToggle
              options={PAYMENT_OPTIONS}
              selected={paymentMethods}
              onChange={setPaymentMethods}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service categories
            </label>
            <PillToggle
              options={CATEGORY_OPTIONS}
              selected={serviceCategories}
              onChange={setServiceCategories}
              labelKey="label"
              valueKey="value"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cities served
            </label>
            <PillToggle
              options={CITY_OPTIONS}
              selected={serviceCities}
              onChange={setServiceCities}
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>

      {/* Section 2 — Company details (read-only) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-bold text-gray-900 mb-6">Company Details</h2>
        <div className="divide-y divide-gray-100">
          {[
            { label: 'Legal company name', value: carrier?.legal_company_name },
            { label: 'GST number', value: carrier?.gst_number },
            {
              label: 'Registration number',
              value: carrier?.company_registration_number,
            },
            { label: 'City', value: carrier?.city },
            { label: 'Postcode', value: carrier?.postcode },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="text-gray-400">{row.label}</span>
              <span className="text-gray-700 font-medium">
                {row.value || '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
