'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { JOB_CATEGORY_GROUPS } from '../schemas'

// Dynamic import for the map — leaflet-draw needs window
const ServiceAreaMap = dynamic(() => import('./ServiceAreaMap'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center text-sm text-gray-400">
      Loading map…
    </div>
  ),
})

export default function NotificationsTab({ carrierId, notifications }) {
  const [jobCategories, setJobCategories] = useState(
    notifications?.job_categories ?? [],
  )
  const [emailFrequency, setEmailFrequency] = useState(
    notifications?.email_frequency ?? 'instantly',
  )
  const [updatesOptIn, setUpdatesOptIn] = useState(
    notifications?.updates_opt_in ?? true,
  )
  const [operationalArea, setOperationalArea] = useState(
    notifications?.operational_area ?? null,
  )
  const [saving, setSaving] = useState(false)

  function toggleCategory(value) {
    setJobCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    )
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/carriers/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_categories: jobCategories,
        email_frequency: emailFrequency,
        updates_opt_in: updatesOptIn,
        operational_area: operationalArea,
      }),
    })
    if (res.ok) toast.success('Notifications updated')
    else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to update')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-8">
      <h2 className="text-lg font-bold text-gray-900">Notifications</h2>

      {/* Job categories */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Job category alerts
        </h3>
        <div className="space-y-4">
          {JOB_CATEGORY_GROUPS.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                {group.group}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const active = jobCategories.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCategory(opt.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email alert frequency */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Email alert frequency
        </h3>
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'instantly', label: 'Instantly' },
            { value: 'hourly', label: 'Hourly' },
            { value: 'daily', label: 'Daily' },
            { value: 'never', label: "Don't send" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                emailFrequency === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="email_frequency"
                value={opt.value}
                checked={emailFrequency === opt.value}
                onChange={(e) => setEmailFrequency(e.target.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Updates from MovingEasy */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Updates from MovingEasy
        </h3>
        <div className="flex gap-3">
          {[
            { value: true, label: 'Yes, send me updates' },
            { value: false, label: 'No thanks' },
          ].map((opt) => (
            <label
              key={String(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border cursor-pointer transition-colors ${
                updatesOptIn === opt.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="updates_opt_in"
                checked={updatesOptIn === opt.value}
                onChange={() => setUpdatesOptIn(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Operational area */}
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">
          Operational area
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          Draw a polygon on the map to define your service area. Click the
          polygon tool (□) to start drawing.
        </p>
        <ServiceAreaMap
          initialGeoJSON={operationalArea}
          onChange={setOperationalArea}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        {saving ? 'Updating…' : 'Update'}
      </button>
    </div>
  )
}
