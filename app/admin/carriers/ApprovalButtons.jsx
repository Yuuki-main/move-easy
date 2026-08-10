'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { XCircle, RotateCcw, Ban, Clock, Loader2 } from 'lucide-react'

export default function ApprovalButtons({ carrierId, currentStatus }) {
  const [loading, setLoading] = useState(null)
  const router = useRouter()

  const updateStatus = async (status) => {
    setLoading(status)
    try {
      const res = await fetch('/api/admin/carriers/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierId, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update')
        setLoading(null)
        return
      }
      if (status === 'rejected') {
        toast.success('Carrier suspended')
      } else if (status === 'active') {
        toast.success('Carrier reactivated')
      } else if (status === 'pending') {
        toast.success('Carrier set to pending')
      }
      router.refresh()
    } catch {
      toast.error('Network error')
      setLoading(null)
    }
  }

  const grantAccess = async () => {
    setLoading('grant')
    try {
      const res = await fetch('/api/admin/carriers/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to grant access')
        setLoading(null)
        return
      }
      toast.success('Access granted — email sent to carrier')
      router.refresh()
    } catch {
      toast.error('Network error')
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Pending → show Approve (with email) + Reject */}
      {currentStatus === 'pending' && (
        <>
          <button
            onClick={grantAccess}
            disabled={loading !== null}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'grant' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            Approve &amp; Email
          </button>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'rejected' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <XCircle size={12} />
            )}
            Reject
          </button>
        </>
      )}

      {/* Rejected → show Reactivate + Set Pending */}
      {currentStatus === 'rejected' && (
        <>
          <button
            onClick={grantAccess}
            disabled={loading !== null}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'grant' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <RotateCcw size={12} />
            )}
            Reactivate &amp; Email
          </button>
          <button
            onClick={() => updateStatus('pending')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'pending' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Clock size={12} />
            )}
            Set Pending
          </button>
        </>
      )}

      {/* Active → show Suspend + Set Pending */}
      {currentStatus === 'active' && (
        <>
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'rejected' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Ban size={12} />
            )}
            Suspend
          </button>
          <button
            onClick={() => updateStatus('pending')}
            disabled={loading !== null}
            className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading === 'pending' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Clock size={12} />
            )}
            Set Pending
          </button>
        </>
      )}
    </div>
  )
}
