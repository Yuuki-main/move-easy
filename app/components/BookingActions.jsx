'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, X, XCircle } from 'lucide-react'

// "Mark complete" + "Cancel booking" for a confirmed booking.
// role: 'carrier' | 'customer' | 'admin'
export default function BookingActions({ bookingId, role, size = 'md' }) {
  const [modal, setModal] = useState(null)
  const small = size === 'sm'

  return (
    <>
      <div className={`flex flex-wrap gap-2 ${small ? '' : 'mt-1'}`}>
        <button
          onClick={() => setModal('complete')}
          className={`inline-flex items-center gap-1.5 rounded-lg bg-teal-600 font-semibold text-white hover:bg-teal-700 ${
            small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <CheckCircle2 size={small ? 13 : 15} />
          Mark job complete
        </button>
        <button
          onClick={() => setModal('cancel')}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white font-medium text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 ${
            small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
          }`}
        >
          <XCircle size={small ? 13 : 15} />
          Cancel booking
        </button>
      </div>

      {modal === 'complete' && (
        <CompleteModal bookingId={bookingId} role={role} onClose={() => setModal(null)} />
      )}
      {modal === 'cancel' && (
        <CancelModal bookingId={bookingId} role={role} onClose={() => setModal(null)} />
      )}
    </>
  )
}

function endpoint(bookingId, role, action) {
  return role === 'admin'
    ? { url: `/api/admin/bookings/${bookingId}`, extra: { action } }
    : { url: `/api/bookings/${bookingId}/${action}`, extra: {} }
}

function useBookingAction(bookingId, role, action, onClose) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function run(body, successMsg) {
    setBusy(true)
    setError('')
    const { url, extra } = endpoint(bookingId, role, action)
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...extra, ...body }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }
    toast.success(successMsg(data))
    onClose()
    router.refresh()
  }

  return { busy, error, run }
}

function CompleteModal({ bookingId, role, onClose }) {
  const { busy, error, run } = useBookingAction(bookingId, role, 'complete', onClose)

  return (
    <Modal title="Mark this job as complete?" onClose={onClose}>
      <p className="text-sm text-gray-600">
        {role === 'customer'
          ? "Confirm the move has been done. You'll then be able to leave a review."
          : 'Confirm the move has been done. The customer will be asked to leave a review.'}
      </p>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <div className="mt-5 flex gap-2">
        <button
          onClick={() => run({}, () => 'Job marked as complete')}
          disabled={busy}
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Yes, the work is done'}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          Not yet
        </button>
      </div>
    </Modal>
  )
}

function CancelModal({ bookingId, role, onClose }) {
  const [reason, setReason] = useState('')
  // Customers choose; a carrier cancelling always reopens the job.
  const [reopen, setReopen] = useState(true)
  const { busy, error, run } = useBookingAction(bookingId, role, 'cancel', onClose)

  const save = () =>
    run({ reason, reopen: role === 'carrier' ? true : reopen }, (data) =>
      data.reopened ? 'Booking cancelled — the request is open again' : 'Booking cancelled',
    )

  return (
    <Modal title="Cancel this booking?" onClose={onClose}>
      {role === 'carrier' && (
        <p className="mb-3 text-sm text-gray-600">
          The customer will be told, and their request will reopen so they can choose another
          mover.
        </p>
      )}

      {role !== 'carrier' && (
        <div className="mb-3 space-y-1.5">
          {[
            { value: true, label: 'Choose another mover', hint: 'Reopen the request; other quotes become available again' },
            { value: false, label: 'Cancel the move entirely', hint: 'Close the request' },
          ].map((o) => (
            <label
              key={String(o.value)}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 text-sm ${
                reopen === o.value ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="reopen"
                checked={reopen === o.value}
                onChange={() => setReopen(o.value)}
                className="mt-0.5 accent-teal-600"
              />
              <span>
                <span className="block font-medium text-gray-800">{o.label}</span>
                <span className="block text-xs text-gray-500">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      <label className="block text-xs font-medium text-gray-600">
        Reason <span className="text-red-500">*</span>
        <textarea
          autoFocus
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the other side know why"
          className="mt-1 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </label>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          onClick={save}
          disabled={busy || !reason.trim()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          {busy ? 'Cancelling…' : 'Cancel booking'}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          Keep booking
        </button>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
