'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AcceptQuoteButton({ quoteId, jobId, variant = 'default' }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const accept = async () => {
    setLoading(true)
    const res = await fetch('/api/quotes/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId, jobId }),
    })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  const className =
    variant === 'primary'
      ? 'w-full bg-red-500 hover:bg-red-600 text-white text-base font-bold py-4 rounded-xl disabled:opacity-50 transition-colors'
      : 'bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors'

  return (
    <button onClick={accept} disabled={loading} className={className}>
      {loading ? 'Booking…' : variant === 'primary' ? 'Accept' : 'Accept this quote'}
    </button>
  )
}
