'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function QuoteForm({ jobId, existingQuote, walletBalance }) {
  const [price, setPrice] = useState(existingQuote?.price || '')
  const [message, setMessage] = useState(existingQuote?.message || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  const platformFee = useMemo(() => {
    if (!price || Number(price) <= 0) return 0
    return Number(price) * 0.18
  }, [price])

  const insufficientBalance = price && platformFee > walletBalance
  const shortfall = insufficientBalance ? (platformFee - walletBalance).toFixed(2) : 0

  if (existingQuote) {
    return (
      <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
        <p className="font-semibold text-teal-800 mb-2">✅ Quote submitted</p>

        <p className="text-sm text-teal-700">
          Your price: <strong>${existingQuote.price}</strong>
        </p>

        {existingQuote.message && (
          <p className="text-sm text-teal-600 mt-2">{existingQuote.message}</p>
        )}

        <p className="text-xs text-teal-500 mt-3">
          Status: {existingQuote.status}
        </p>
      </div>
    )
  }

  const submit = async () => {
    if (!price) {
      setError('Please enter a price')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/quotes/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          price: Number(price),
          message,
        }),
      })

      const data = await res.json()

      if (data.insufficientBalance) {
        toast.error(
          `Your wallet balance is too low to submit this quote. Please add another $${data.shortfall} to continue.`,
          { duration: 6000 },
        )
        router.push('/dashboard/carrier/wallet')
        return
      }

      if (data.error) {
        setError(data.error)
        setLoading(false)
        return
      }

      router.refresh()
    } catch (err) {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-lg font-bold mb-5">Submit your quote</h2>

      <div className="space-y-4">
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Your price ($)
            <span className="text-red-400"> *</span>
          </label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 350"
            className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            Message to customer
            <span className="text-gray-400 font-normal"> (optional)</span>
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Tell the customer why they should choose you..."
            className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Platform fee breakdown */}
      {price && Number(price) > 0 && (
        <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Your wallet balance</span>
            <span className="font-medium">${walletBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform fee (18%)</span>
            <span className="font-medium">${platformFee.toFixed(2)}</span>
          </div>
          {insufficientBalance && (
            <div className="flex justify-between text-red-600 pt-2 border-t border-gray-200">
              <span>Shortfall</span>
              <span className="font-semibold">${shortfall}</span>
            </div>
          )}
        </div>
      )}

      {/* Insufficient balance warning */}
      {insufficientBalance && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-start gap-2">
          <svg className="h-5 w-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="font-semibold">Insufficient wallet balance</p>
            <p className="mt-0.5">
              You need at least <strong>${platformFee.toFixed(2)}</strong> to submit this quote. Add ${shortfall} to your wallet.
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <button
        onClick={insufficientBalance ? () => router.push('/dashboard/carrier/wallet') : submit}
        disabled={loading}
        className={`mt-5 w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-50 transition-colors ${
          insufficientBalance
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {loading ? 'Submitting...' : insufficientBalance ? 'Top Up Wallet' : 'Submit Quote'}
      </button>
    </div>
  )
}
