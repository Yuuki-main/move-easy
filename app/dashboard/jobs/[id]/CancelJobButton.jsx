'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelJobButton({ jobId }) {
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const router = useRouter()

  const cancel = async () => {
    setLoading(true)
    await fetch('/api/jobs/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
    router.push('/dashboard')
    router.refresh()
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-red-500">Are you sure? This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            onClick={cancel}
            disabled={loading}
            className="bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Cancelling...' : 'Yes, cancel'}
          </button>
          <button
            onClick={() => setConfirm(false)}
            className="border border-gray-300 text-sm px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Keep it
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="bg-red-100 text-red-600 text-sm font-semibold px-5 py-2.5 rounded-lg text-center hover:bg-red-200 transition-colors"
    >
      Cancel request
    </button>
  )
}
