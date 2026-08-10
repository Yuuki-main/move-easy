'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, FileText, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { DOCUMENT_TYPES } from '../schemas'

export default function VerificationTab({ carrierId, documents: initial }) {
  const [documents, setDocuments] = useState(initial ?? [])
  const [docType, setDocType] = useState('proof_of_address')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', docType)

    try {
      const res = await fetch('/api/carriers/settings/documents', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const json = await res.json()
        setDocuments((prev) => [...prev, json.data])
        toast.success('Document uploaded')
        if (fileRef.current) fileRef.current.value = ''
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Upload failed')
      }
    } catch {
      toast.error('Upload failed')
    }
    setUploading(false)
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/carriers/settings/documents/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setDocuments((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document removed')
    } else {
      toast.error('Failed to remove')
    }
  }

  function statusBadge(status) {
    const config = {
      approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Approved' },
      disapproved: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Disapproved' },
      pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
    }
    const s = config[status] || config.pending
    const Icon = s.icon
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.color} ${s.bg}`}
      >
        <Icon size={12} />
        {s.label}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Verification</h2>

      <p className="text-sm text-gray-500 mb-6">
        Upload verification documents. These will be reviewed by our team.
        Approved documents help build trust with customers.
      </p>

      {/* Upload */}
      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Document type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {DOCUMENT_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 cursor-pointer transition-colors">
            <Upload size={14} />
            {uploading ? 'Uploading…' : 'Upload file'}
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Document list */}
      {documents.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          No documents uploaded yet.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText size={18} className="text-gray-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 capitalize truncate">
                    {doc.document_type?.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(doc.created_at).toLocaleDateString('en-NZ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {statusBadge(doc.status)}
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Admin review is required for document approval. This is a separate
        admin-side feature.
      </p>
    </div>
  )
}
