'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ReviewForm({ bookingId, jobId, carrierId }) {
  const [rating, setRating] = useState(8)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const submit = async () => {
    setLoading(true)
    const res = await fetch('/api/reviews/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, jobId, carrierId, rating, comment }),
    })
    const data = await res.json()
    if (data.error) {
      alert(data.error)
      setLoading(false)
      return
    }
    setSubmitted(true)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center text-sm text-green-700">
        ✓ Thanks for your review!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="font-bold text-lg mb-4">How was your move?</h2>
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Rating: {rating}/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full"
        />
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Tell others about your experience..."
        className="w-full border rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={submit}
        disabled={loading}
        className="mt-4 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  )
}
