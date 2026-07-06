'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApprovalButtons({ carrierId }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const updateStatus = async (status) => {
    setLoading(true)
    const res = await fetch('/api/admin/carriers/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrierId, status }),
    })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => updateStatus('active')}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        Approve
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        Reject
      </button>
    </div>
  )
}
