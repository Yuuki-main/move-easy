'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

export default function ReviewButton({ type, id, carrierId }) {
  const [loading, setLoading] = useState(null) // 'approve' | 'disapprove' | null
  const router = useRouter()

  const handleReview = async (status) => {
    setLoading(status)
    try {
      const res = await fetch(`/api/admin/review/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to update')
        setLoading(null)
        return
      }

      toast.success(
        `${type === 'document' ? 'Document' : 'Insurance'} ${status === 'approved' ? 'approved' : 'disapproved'}`,
      )
      router.refresh()
    } catch {
      toast.error('Network error')
    }
    setLoading(null)
  }

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => handleReview('approved')}
        disabled={loading !== null}
        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'approved' ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Check size={12} />
        )}
        Approve
      </button>
      <button
        onClick={() => handleReview('disapproved')}
        disabled={loading !== null}
        className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'disapproved' ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <X size={12} />
        )}
        Disapprove
      </button>
    </div>
  )
}
