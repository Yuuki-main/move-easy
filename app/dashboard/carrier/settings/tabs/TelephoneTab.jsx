'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { telephoneSchema, COUNTRY_CODES } from '../schemas'

export default function TelephoneTab({ carrierId, telephones: initial }) {
  const [telephones, setTelephones] = useState(initial ?? [])
  const [showAdd, setShowAdd] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(telephoneSchema),
    defaultValues: { country_code: '+64', number: '', type: 'mobile' },
  })

  async function onAdd(data) {
    const res = await fetch('/api/carriers/settings/telephone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const json = await res.json()
      setTelephones((prev) => [...prev, json.data])
      reset({ country_code: '+64', number: '', type: 'mobile' })
      setShowAdd(false)
      toast.success('Number added')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to add')
    }
  }

  async function handleRemove(id) {
    const res = await fetch(`/api/carriers/settings/telephone/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setTelephones((prev) => prev.filter((t) => t.id !== id))
      toast.success('Number removed')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to remove')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Telephone Numbers</h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
          >
            <Plus size={16} />
            Add
          </button>
        )}
      </div>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleSubmit(onAdd)}
          className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3"
        >
          <div className="grid grid-cols-[100px_1fr_120px] gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Code
              </label>
              <select
                {...register('country_code')}
                className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Number
              </label>
              <input
                {...register('number')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. 212345678"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Type
              </label>
              <select
                {...register('type')}
                className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="mobile">Mobile</option>
                <option value="landline">Landline</option>
              </select>
            </div>
          </div>
          {errors.number && (
            <p className="text-red-500 text-xs">{errors.number.message}</p>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding…' : 'Add'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {telephones.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 text-center py-8">
          No phone numbers added yet. At least one mobile number is required for approval.
        </p>
      )}

      <div className="space-y-2">
        {telephones.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
          >
            <div>
              <span className="text-sm font-medium text-gray-900">
                {t.country_code} {t.number}
              </span>
              <span className="ml-2 text-xs text-gray-400 capitalize">
                ({t.type})
              </span>
            </div>
            <button
              onClick={() => handleRemove(t.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
