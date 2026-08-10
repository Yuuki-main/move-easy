'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function GrantAccessButton({ carrierId }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleGrant = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/carriers/grant-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carrierId }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to grant access')
        setLoading(false)
        return
      }

      toast.success('Access granted — email sent to carrier')
      router.refresh()
    } catch {
      toast.error('Network error')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleGrant}
      disabled={loading}
      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
    >
      {loading ? (
        <Loader2 size={12} className="animate-spin" />
      ) : (
        <CheckCircle size={12} />
      )}
      Grant Access
    </button>
  )
}
