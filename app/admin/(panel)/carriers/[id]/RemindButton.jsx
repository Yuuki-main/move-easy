'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail } from 'lucide-react'

export default function RemindButton({ carrierId }) {
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    const res = await fetch('/api/admin/carriers/remind', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carrierId }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      toast.error(data.error || 'Could not send the reminder')
      return
    }
    toast.success(`Reminder sent to ${data.sentTo}`)
  }

  return (
    <button
      onClick={send}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
    >
      <Mail size={13} />
      {busy ? 'Sending…' : 'Email reminder'}
    </button>
  )
}
