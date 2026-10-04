'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarClock,
  ChevronDown,
  CreditCard,
  DollarSign,
  Hourglass,
  MessageSquareText,
  SlidersHorizontal,
  Wallet,
  X,
  XCircle,
} from 'lucide-react'
import {
  COLLECTION_DATE_TYPES,
  PAYMENT_METHODS,
  PAYMENT_TIMEFRAMES,
  formatMoney,
} from '@/lib/quotes'

const ITEMS = [
  { key: 'price', label: 'Change price', icon: DollarSign },
  { key: 'collection_date', label: 'Change collection date', icon: CalendarClock },
  { key: 'payment_timeframes', label: 'Change payment option', icon: Wallet },
  { key: 'payment_methods', label: 'Change payment method', icon: CreditCard },
  { key: 'message', label: 'Change note to customer', icon: MessageSquareText },
  { key: 'expiry', label: 'Change expiry', icon: Hourglass },
  { key: 'other', label: 'Other changes', icon: SlidersHorizontal },
]

export default function AmendQuoteMenu({ quote, defaults, lowestOther }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setMenuOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const open = (key) => {
    setMenuOpen(false)
    setModal(key)
  }
  const close = () => setModal(null)
  const props = { quote, defaults, lowestOther, onClose: close }

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setMenuOpen((o) => !o)}
        aria-expanded={menuOpen}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
      >
        Amend quote
        <ChevronDown size={15} className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 z-20 mt-1.5 w-60 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => open(key)}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              <Icon size={15} className="text-gray-400" />
              {label}
            </button>
          ))}
          <div className="my-1 border-t border-gray-100" />
          <button
            onClick={() => open('withdraw')}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <XCircle size={15} />
            Withdraw quote
          </button>
        </div>
      )}

      {modal === 'price' && <PriceModal {...props} />}
      {modal === 'collection_date' && <CollectionModal {...props} />}
      {modal === 'payment_timeframes' && (
        <ChecklistModal
          {...props}
          action="payment_timeframes"
          title="Payment option"
          hint="When can the customer pay you?"
          options={PAYMENT_TIMEFRAMES}
          initial={quote.payment_timeframes ?? defaults.timeframes}
        />
      )}
      {modal === 'payment_methods' && (
        <ChecklistModal
          {...props}
          action="payment_methods"
          title="Payment method"
          hint="How can the customer pay you?"
          options={PAYMENT_METHODS}
          initial={quote.payment_methods ?? defaults.methods}
        />
      )}
      {modal === 'message' && <MessageModal {...props} />}
      {modal === 'expiry' && <ExpiryModal {...props} />}
      {modal === 'other' && <OtherModal {...props} />}
      {modal === 'withdraw' && <WithdrawModal {...props} />}
    </div>
  )
}

// ── Shared plumbing ────────────────────────────────────────────────────────

function useAmend(quoteId, onClose) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(payload, successMsg) {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(data.error || 'Something went wrong')
      return
    }
    toast.success(successMsg)
    onClose()
    router.refresh()
  }

  return { busy, error, setError, submit }
}

function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // Portal out of the sticky price box, which would otherwise trap z-index.
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[1px]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-center justify-between">
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
        {footer}
      </div>
    </div>,
    document.body,
  )
}

function Footer({ busy, error, label = 'Save changes', onSave, onClose, danger }) {
  return (
    <>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={busy}
          className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
          }`}
        >
          {busy ? 'Saving…' : label}
        </button>
        <button
          onClick={onClose}
          disabled={busy}
          className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
    </>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:bg-gray-50 disabled:text-gray-400'

// ── Individual amendments ──────────────────────────────────────────────────

function PriceModal({ quote, lowestOther, onClose }) {
  const [price, setPrice] = useState(String(quote.price))
  const { busy, error, submit } = useAmend(quote.id, onClose)
  const save = () => submit({ action: 'price', price: Number(price) }, 'Price updated')

  return (
    <Modal
      title="Update price"
      onClose={onClose}
      footer={<Footer busy={busy} error={error} onSave={save} onClose={onClose} />}
    >
      <label className="flex items-center justify-between rounded-xl bg-gray-900 px-4 py-3 text-white">
        <span className="text-sm">Your price</span>
        <span className="flex items-center gap-1 text-lg font-semibold">
          $
          <input
            autoFocus
            type="number"
            min="1"
            step="1"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="w-24 border-b border-white/40 bg-transparent text-right focus:border-white focus:outline-none"
          />
        </span>
      </label>
      {lowestOther != null && (
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
          <span>
            Lowest competing bid:{' '}
            <span className="font-semibold text-gray-800">{formatMoney(lowestOther)}</span>
          </span>
          {Number(price) !== lowestOther && (
            <button
              onClick={() => setPrice(String(lowestOther))}
              className="font-semibold text-teal-700 hover:underline"
            >
              Use this price
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

function CollectionModal({ quote, onClose }) {
  const [type, setType] = useState(quote.collection_date_type ?? 'flexible')
  const [days, setDays] = useState(quote.collection_within_days ?? 7)
  const [from, setFrom] = useState(quote.collection_date_from ?? '')
  const [to, setTo] = useState(quote.collection_date_to ?? '')
  const { busy, error, submit } = useAmend(quote.id, onClose)
  const today = new Date().toISOString().slice(0, 10)

  const needsFrom = ['on', 'from', 'between'].includes(type)
  const needsTo = ['before', 'between'].includes(type)

  return (
    <Modal
      title="Collection date"
      onClose={onClose}
      footer={
        <Footer
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={() =>
            submit(
              { action: 'collection_date', type, days: Number(days), from, to },
              'Collection date updated',
            )
          }
        />
      }
    >
      <p className="mb-2 text-xs text-gray-500">When can you collect the goods?</p>
      <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
        {COLLECTION_DATE_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {type === 'within_days' && (
        <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
          Within
          <input
            type="number"
            min="1"
            max="365"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className={`${inputCls} w-20`}
          />
          days of booking
        </label>
      )}
      {(needsFrom || needsTo) && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {needsFrom && (
            <label className="text-xs text-gray-500">
              {type === 'between' ? 'From' : type === 'on' ? 'Date' : 'Earliest date'}
              <input
                type="date"
                min={today}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={`${inputCls} mt-1`}
              />
            </label>
          )}
          {needsTo && (
            <label className="text-xs text-gray-500">
              {type === 'between' ? 'To' : 'Latest date'}
              <input
                type="date"
                min={from || today}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={`${inputCls} mt-1`}
              />
            </label>
          )}
        </div>
      )}
    </Modal>
  )
}

function ChecklistModal({ quote, onClose, action, title, hint, options, initial }) {
  const [picked, setPicked] = useState(() => new Set(initial ?? []))
  const { busy, error, submit } = useAmend(quote.id, onClose)

  const toggle = (opt) =>
    setPicked((s) => {
      const next = new Set(s)
      next.has(opt) ? next.delete(opt) : next.add(opt)
      return next
    })

  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <Footer
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={() => submit({ action, values: [...picked] }, `${title} updated`)}
        />
      }
    >
      <p className="mb-2 text-xs text-gray-500">{hint}</p>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              picked.has(opt)
                ? 'border-teal-500 bg-teal-50 text-teal-800'
                : 'border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <input
              type="checkbox"
              checked={picked.has(opt)}
              onChange={() => toggle(opt)}
              className="accent-teal-600"
            />
            {opt}
          </label>
        ))}
      </div>
    </Modal>
  )
}

function MessageModal({ quote, onClose }) {
  const [message, setMessage] = useState(quote.message ?? '')
  const { busy, error, submit } = useAmend(quote.id, onClose)

  return (
    <Modal
      title="Note to customer"
      onClose={onClose}
      footer={
        <Footer
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={() => submit({ action: 'message', message }, 'Note updated')}
        />
      }
    >
      <textarea
        autoFocus
        rows={5}
        maxLength={2000}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tell the customer what's included and why they should pick you…"
        className={`${inputCls} resize-y`}
      />
      <p className="mt-1 text-right text-[11px] text-gray-400">{message.length}/2000</p>
    </Modal>
  )
}

function toLocalParts(iso) {
  if (!iso) return { date: '', time: '17:00' }
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

function ExpiryModal({ quote, onClose }) {
  const initial = toLocalParts(quote.expires_at)
  const [never, setNever] = useState(!quote.expires_at)
  const [date, setDate] = useState(initial.date)
  const [time, setTime] = useState(initial.time)
  const { busy, error, setError, submit } = useAmend(quote.id, onClose)
  const today = new Date().toISOString().slice(0, 10)

  const save = () => {
    if (never) return submit({ action: 'expiry', expiresAt: null }, 'Quote no longer expires')
    if (!date) return setError('Choose a date, or tick "Never expires"')
    // Local wall-clock time → absolute instant
    const at = new Date(`${date}T${time || '00:00'}`)
    submit({ action: 'expiry', expiresAt: at.toISOString() }, 'Expiry updated')
  }

  return (
    <Modal
      title="Quote expiry"
      onClose={onClose}
      footer={<Footer busy={busy} error={error} onClose={onClose} onSave={save} />}
    >
      <p className="mb-2 text-xs text-gray-500">
        After this time the customer can no longer accept your quote.
      </p>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          type="date"
          min={today}
          value={date}
          disabled={never}
          onChange={(e) => setDate(e.target.value)}
          className={inputCls}
        />
        <input
          type="time"
          value={time}
          disabled={never}
          onChange={(e) => setTime(e.target.value)}
          className={`${inputCls} w-28`}
        />
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={never}
          onChange={(e) => setNever(e.target.checked)}
          className="accent-teal-600"
        />
        Never expires
      </label>
    </Modal>
  )
}

function OtherModal({ quote, onClose }) {
  const [ev, setEv] = useState(Boolean(quote.electric_vehicle))
  const { busy, error, submit } = useAmend(quote.id, onClose)

  return (
    <Modal
      title="Other changes"
      onClose={onClose}
      footer={
        <Footer
          busy={busy}
          error={error}
          onClose={onClose}
          onSave={() => submit({ action: 'other', electricVehicle: ev }, 'Quote updated')}
        />
      }
    >
      <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
        <input
          type="checkbox"
          checked={ev}
          onChange={(e) => setEv(e.target.checked)}
          className="mt-0.5 accent-teal-600"
        />
        <span>
          <span className="block text-sm font-medium text-gray-800">Electric vehicle</span>
          <span className="block text-xs text-gray-500">
            The move will be done in an electric vehicle. Shown to the customer as a badge on your
            quote.
          </span>
        </span>
      </label>
    </Modal>
  )
}

function WithdrawModal({ quote, onClose }) {
  const { busy, error, submit } = useAmend(quote.id, onClose)

  return (
    <Modal
      title="Withdraw quote?"
      onClose={onClose}
      footer={
        <Footer
          danger
          busy={busy}
          error={error}
          label="Withdraw"
          onClose={onClose}
          onSave={() => submit({ action: 'withdraw' }, 'Quote withdrawn')}
        />
      }
    >
      <p className="text-sm text-gray-600">
        The customer will no longer see your {formatMoney(quote.price)} quote. You can quote this
        job again later while it&apos;s still open.
      </p>
    </Modal>
  )
}
