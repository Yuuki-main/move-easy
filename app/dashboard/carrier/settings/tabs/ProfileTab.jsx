'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import { profileSchema } from '../schemas'

const PAYMENT_OPTIONS = [
  'Cash', 'Bank Transfer', 'Credit Card', 'Debit Card', 'PayPal', 'Cheque',
]

export default function ProfileTab({ carrier }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      public_name: carrier?.public_name ?? '',
      profile_description: carrier?.profile_description ?? '',
      payment_methods: carrier?.payment_methods ?? [],
    },
  })

  const description = watch('profile_description')

  async function onSubmit(data) {
    const res = await fetch('/api/carriers/settings/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) toast.success('Profile updated')
    else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to update')
    }
  }

  async function handleImproveText() {
    // TODO: Wire up AI text improvement when endpoint is available
    toast.info('AI text improvement coming soon')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Profile</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Public profile name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Public profile name <span className="text-red-400">*</span>
          </label>
          <input
            {...register('public_name')}
            className={`w-full rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${
              errors.public_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="How you'll appear to customers"
          />
          {errors.public_name && (
            <p className="text-red-500 text-xs mt-1">{errors.public_name.message}</p>
          )}
        </div>

        {/* Profile description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Profile description
          </label>
          <textarea
            {...register('profile_description')}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            placeholder="Tell customers about your service, experience, and what makes you stand out"
          />
          {description && (
            <button
              type="button"
              onClick={handleImproveText}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-purple-600 hover:text-purple-800 transition-colors"
            >
              <Sparkles size={14} />
              Improve text
            </button>
          )}
        </div>

        {/* Payment methods */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment methods <span className="text-red-400">*</span>
          </label>
          <Controller
            name="payment_methods"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {PAYMENT_OPTIONS.map((method) => {
                  const active = field.value.includes(method)
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        field.onChange(
                          active
                            ? field.value.filter((v) => v !== method)
                            : [...field.value, method],
                        )
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                        active
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {method}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.payment_methods && (
            <p className="text-red-500 text-xs mt-1">
              {errors.payment_methods.message}
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
