'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function QuoteForm({ jobId, existingQuote }) {
  const [price, setPrice] = useState(existingQuote?.price || '')
  const [message, setMessage] = useState(existingQuote?.message || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

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

      {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

      <button
        onClick={submit}
        disabled={loading}
        className="mt-5 w-full rounded-xl bg-teal-600 py-3.5 font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Quote'}
      </button>
    </div>
  )
}
