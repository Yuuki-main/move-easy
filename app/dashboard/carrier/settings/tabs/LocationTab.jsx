'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { locationSchema } from '../schemas'

export default function LocationTab({ carrier }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      address_type: carrier?.address_type ?? 'personal',
      address_line1: carrier?.address_line1 ?? '',
      address_line2: carrier?.address_line2 ?? '',
      city: carrier?.city ?? '',
      postcode: carrier?.postcode ?? '',
      country: carrier?.country ?? 'New Zealand',
    },
  })

  const addressType = watch('address_type')

  async function onSubmit(data) {
    const res = await fetch('/api/carriers/settings/location', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) toast.success('Location updated')
    else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to update')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Location</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Address type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address type
          </label>
          <div className="flex gap-4">
            {['personal', 'company'].map((type) => (
              <label
                key={type}
                className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-sm font-medium text-center transition ${
                  addressType === type
                    ? 'border-gray-900 text-gray-900 bg-gray-50'
                    : 'border-gray-200 text-gray-500'
                }`}
              >
                <input
                  type="radio"
                  {...register('address_type')}
                  value={type}
                  className="sr-only"
                />
                {type === 'personal' ? 'Personal address' : 'Company address'}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address line 1 <span className="text-red-400">*</span>
          </label>
          <input
            {...register('address_line1')}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.address_line1 ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Street address"
          />
          {errors.address_line1 && (
            <p className="text-red-500 text-xs mt-1">{errors.address_line1.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address line 2
          </label>
          <input
            {...register('address_line2')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Apartment, suite, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City <span className="text-red-400">*</span>
            </label>
            <input
              {...register('city')}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="City"
            />
            <p className="text-xs text-gray-400 mt-1">
              City will be shown on your public profile
            </p>
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Postcode
            </label>
            <input
              {...register('postcode')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="Postcode"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Country <span className="text-red-400">*</span>
          </label>
          <input
            {...register('country')}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.country ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.country && (
            <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 hover:bg-gray-700 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Updating…' : 'Update'}
        </button>
      </form>
    </div>
  )
}
