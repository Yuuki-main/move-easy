'use client'
import { useState } from 'react'

export default function WalletTopup() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const handleTopup = async () => {
    const num = parseInt(amount, 10)
    if (!num || num < 10 || num > 10000) {
      alert('Enter an amount between $10 and $10,000')
      return
    }
    setLoading(true)
    const res = await fetch('/api/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: num }),
    })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      console.log('Data', data.error)
      setLoading(false)
    } else if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <div className="flex gap-3">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
          $
        </span>
        <input
          type="number"
          min={10}
          max={10000}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className="w-full border border-gray-200 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
        />
      </div>
      <button
        onClick={handleTopup}
        disabled={loading || !amount}
        className="shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl px-6 py-3 text-sm font-bold transition-all disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting…' : 'Top up'}
      </button>
    </div>
  )
}
