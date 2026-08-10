'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { identitySchema, TIMEZONE_OPTIONS } from '../schemas'

export default function IdentityTab({ profile, carrier, userEmail }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      email: userEmail ?? '',
      last_name: profile?.last_name ?? '',
      date_of_birth: profile?.date_of_birth ?? '',
      timezone: carrier?.timezone ?? 'Pacific/Auckland',
      new_password: '',
    },
  })

  async function onSubmit(data) {
    const res = await fetch('/api/carriers/settings/identity', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast.success('Identity updated')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to update')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Identity</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* First name — read-only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First name
          </label>
          <input
            value={profile?.first_name ?? ''}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            Account settings to make a change
          </p>
        </div>

        {/* Last name — editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input
            value={profile?.last_name ?? ''}
            disabled
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">
            Account settings to make a change
          </p>
        </div>
        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last name
          </label>
          <input
            {...register('last_name')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="Your last name"
          />
          {errors.last_name && (
            <p className="text-red-500 text-xs mt-1">
              {errors.last_name.message}
            </p>
          )}
        </div> */}

        {/* Date of birth — editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of birth
          </label>
          <input
            type="date"
            {...register('date_of_birth')}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">
            We never share it with other users
          </p>
          {errors.date_of_birth && (
            <p className="text-red-500 text-xs mt-1">
              {errors.date_of_birth.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            {...register('email')}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time zone
          </label>
          <select
            {...register('timezone')}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.timezone ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          {errors.timezone && (
            <p className="text-red-500 text-xs mt-1">
              {errors.timezone.message}
            </p>
          )}
        </div>

        {/* New password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            type="password"
            {...register('new_password')}
            placeholder="Leave empty if not willing to change it"
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.new_password
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
          />
          {errors.new_password && (
            <p className="text-red-500 text-xs mt-1">
              {errors.new_password.message}
            </p>
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
