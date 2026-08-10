'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { companySchema } from '../schemas'

export default function CompanyTab({ carrier }) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      legal_company_name: carrier?.legal_company_name ?? '',
      company_registration_number: carrier?.company_registration_number ?? '',
      gst_number: carrier?.gst_number ?? '',
      is_gst_registered: carrier?.is_gst_registered ?? true,
      is_individual_carrier: carrier?.is_individual_carrier ?? false,
    },
  })

  const isIndividual = watch('is_individual_carrier')
  const isGst = watch('is_gst_registered')

  async function onSubmit(data) {
    const res = await fetch('/api/carriers/settings/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) toast.success('Company details updated')
    else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to update')
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Company Details</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Individual carrier toggle */}
        <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200">
          <input
            type="checkbox"
            {...register('is_individual_carrier')}
            className="rounded w-4 h-4"
          />
          <span className="text-sm text-gray-700">
            Operating as an individual carrier (not a company)
          </span>
        </label>

        {/* Company fields — hidden when individual */}
        {!isIndividual && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Legal company name
              </label>
              <input
                {...register('legal_company_name')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Registered business name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company registration number
              </label>
              <input
                {...register('company_registration_number')}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g. 1234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST number
              </label>
              <input
                {...register('gst_number')}
                disabled={!isGst}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
                placeholder="GST registration number"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register('is_gst_registered')}
                className="rounded w-4 h-4"
              />
              <span className="text-sm text-gray-700">Not GST-registered</span>
            </label>
          </>
        )}

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
