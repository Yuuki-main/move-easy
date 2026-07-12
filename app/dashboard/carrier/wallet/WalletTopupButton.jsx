'use client'
import { useState } from 'react'

export default function WalletTopupButton({ amount }) {
  const [loading, setLoading] = useState(false)

  const handleTopup = async () => {
    setLoading(true)
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else {
      alert('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTopup}
      disabled={loading}
      className="border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 rounded-xl py-3 text-sm font-bold text-gray-700 transition-all disabled:opacity-50"
    >
      {loading ? '...' : `$${amount}`}
    </button>
  )
}
