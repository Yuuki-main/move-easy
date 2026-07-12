'use client'

import { useState } from 'react'

export default function AccountForm({ user, profile, carrierProfile }) {
  const [firstName, setFirstName] = useState(profile?.first_name || '')
  const [lastName, setLastName] = useState(profile?.last_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initial = (profile?.first_name || '?').charAt(0).toUpperCase()
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-NZ', {
        year: 'numeric',
        month: 'long',
      })
    : '—'

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/profile/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, phone }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Profile header */}
      <div className="flex items-center gap-5 mb-10">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-white text-2xl font-bold shrink-0">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            {profile?.first_name} {profile?.last_name}
          </h1>
          <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize bg-zinc-100 text-zinc-700">
            {profile?.role || 'customer'}
          </span>
          <p className="text-sm text-zinc-500 mt-1">
            Member since {memberSince}
          </p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            First name
          </label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Last name
          </label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1.5">
            Phone
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-black transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
        </button>
      </div>

      {/* Carrier profile (read-only) */}
      {carrierProfile && (
        <div className="mt-10 p-6 rounded-2xl border border-zinc-200 bg-zinc-50">
          <h2 className="text-lg font-bold text-zinc-900 mb-4">
            Carrier Profile
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-500">Public name</span>
              <span className="font-medium text-zinc-800">
                {carrierProfile.public_name || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Status</span>
              <span
                className={`font-semibold capitalize ${
                  carrierProfile.application_status === 'active'
                    ? 'text-green-600'
                    : carrierProfile.application_status === 'pending'
                      ? 'text-amber-600'
                      : 'text-red-600'
                }`}
              >
                {carrierProfile.application_status || 'pending'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">City</span>
              <span className="font-medium text-zinc-800">
                {carrierProfile.city || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Categories</span>
              <span className="font-medium text-zinc-800 text-right max-w-[60%]">
                {carrierProfile.service_categories?.join(', ') || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Payment methods</span>
              <span className="font-medium text-zinc-800 text-right max-w-[60%]">
                {carrierProfile.payment_methods?.join(', ') || '—'}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
