'use client'

import { useState } from 'react'

export default function PreBookingMessage({ jobId, carrierId }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    setError('')
    const res = await fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, receiverId: carrierId, body: text.trim() }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Failed to send.')
      setSending(false)
      return
    }
    setSent(true)
    setText('')
    setSending(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
        ✓ Message sent. The carrier will reply soon.
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm font-bold text-gray-900 mb-2">Have a question?</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Have a question? Send your message here."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <p className="text-xs text-gray-400 mt-1 mb-3">
        Do not share your contact information, just yet.
      </p>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <button
        onClick={send}
        disabled={sending || !text.trim()}
        className="bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl disabled:opacity-40 transition-colors"
      >
        {sending ? 'Sending…' : 'Send a message'}
      </button>
    </div>
  )
}
