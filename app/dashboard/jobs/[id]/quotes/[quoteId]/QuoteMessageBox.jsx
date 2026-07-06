'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function QuoteMessageBox({ jobId, currentUserId, receiverId }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    const supabase = createClient()
    await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: currentUserId,
      receiver_id: receiverId,
      body: text.trim(),
    })
    setSent(true)
    setSending(false)
  }

  if (sent) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-sm text-green-700 text-center font-medium">
        Message sent! The carrier will reply shortly.
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Have a question? Send your message here."
        rows={3}
        className="w-full text-sm text-gray-700 p-4 resize-none focus:outline-none block"
      />
      <div className="px-4 pb-4 pt-1">
        <p className="text-xs text-gray-400 text-center mb-3">
          Do not share your contact information, just yet.
        </p>
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
        >
          {sending ? 'Sending…' : 'Send a message'}
        </button>
      </div>
    </div>
  )
}
