'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Plus, Trash2, Shield, Upload } from 'lucide-react'
import { insuranceSchema } from '../schemas'

export default function InsuranceTab({ carrierId, insurance: initial }) {
  const [policies, setPolicies] = useState(initial ?? [])
  const [showAdd, setShowAdd] = useState(false)
  const [proofFile, setProofFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(insuranceSchema),
    defaultValues: { provider_name: '', coverage_amount: '' },
  })

  async function onAdd(data) {
    setUploading(true)

    let proofUrl = null
    let proofKey = null

    if (proofFile) {
      const formData = new FormData()
      formData.append('file', proofFile)
      const uploadRes = await fetch('/api/carriers/settings/documents', {
        method: 'POST',
        body: formData,
      })
      if (uploadRes.ok) {
        const json = await uploadRes.json()
        proofUrl = json.data.file_url
        proofKey = json.data.file_key
      } else {
        const err = await uploadRes.json()
        toast.error(err.error || 'Failed to upload proof file')
        setUploading(false)
        return
      }
    }

    const res = await fetch('/api/carriers/settings/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_name: data.provider_name,
        coverage_amount: data.coverage_amount,
        proof_url: proofUrl,
        proof_key: proofKey,
      }),
    })

    if (res.ok) {
      const json = await res.json()
      setPolicies((prev) => [...prev, json.data])
      reset()
      setProofFile(null)
      setShowAdd(false)
      if (fileRef.current) fileRef.current.value = ''
      toast.success('Insurance policy added')
    } else {
      const err = await res.json()
      toast.error(err.error ?? 'Failed to add')
    }
    setUploading(false)
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/carriers/settings/insurance/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setPolicies((prev) => prev.filter((p) => p.id !== id))
      toast.success('Policy removed')
    } else {
      toast.error('Failed to remove')
    }
  }

  function statusBadge(status) {
    const config = {
      approved: { color: 'text-green-600 bg-green-50', label: 'Approved' },
      disapproved: { color: 'text-red-600 bg-red-50', label: 'Disapproved' },
      pending: { color: 'text-amber-600 bg-amber-50', label: 'Pending' },
    }
    const s = config[status] || config.pending
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color}`}
      >
        {s.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">Insurance</h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
          >
            <Plus size={16} />
            Add policy
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-6">
        Your insurance policy appears on your profile — it&apos;s a great way to
        build trust and give customers confidence when booking with you.
      </p>

      {/* Add form */}
      {showAdd && (
        <form
          onSubmit={handleSubmit(onAdd)}
          className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Provider name <span className="text-red-400">*</span>
            </label>
            <input
              {...register('provider_name')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="e.g. AA Insurance"
            />
            {errors.provider_name && (
              <p className="text-red-500 text-xs mt-1">{errors.provider_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Coverage amount
            </label>
            <input
              {...register('coverage_amount')}
              type="number"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              placeholder="e.g. 1000000"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Proof of policy
            </label>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Upload size={14} />
              {proofFile ? proofFile.name : 'Upload file'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

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
              disabled={isSubmitting || uploading}
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Add policy'}
            </button>
          </div>
        </form>
      )}

      {/* Policy list */}
      {policies.length === 0 && !showAdd && (
        <p className="text-sm text-gray-400 text-center py-8">
          No insurance policies added yet.
        </p>
      )}

      <div className="space-y-2">
        {policies.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Shield size={18} className="text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {p.provider_name}
                </p>
                {p.coverage_amount && (
                  <p className="text-xs text-gray-400">
                    ${Number(p.coverage_amount).toLocaleString('en-NZ')} coverage
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {statusBadge(p.status)}
              <button
                onClick={() => handleDelete(p.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
