'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Zap } from 'lucide-react'
import {
  formatMoney,
  jobTitle,
  leadStatus,
  relativeTime,
  shortAddress,
  shortJobRef,
} from '@/lib/quotes'

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'booked', label: 'Booked' },
  { key: 'lost', label: 'Lost' },
  { key: 'expired', label: 'Expired' },
  { key: 'withdrawn', label: 'Withdrawn' },
]

const fmtDateTime = (d) =>
  new Date(d).toLocaleString('en-NZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

const fmtShortDate = (d) =>
  new Date(d).toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

// Sort keys → value getters
const SORTERS = {
  job: (r) => jobTitle({ type: r.job.type }),
  price: (r) => r.price,
  bids: (r) => r.bidCount,
  position: (r) => {
    const s = leadStatus(r.price, r.competitorPrices)
    return s.kind === 'losing' ? s.diff : s.kind === 'tie' ? 0 : -1 - s.diff
  },
  messages: (r) => r.messages.mine,
  route: (r) => r.job.distance ?? -1,
  quoted: (r) => new Date(r.quotedAt).getTime(),
  created: (r) => new Date(r.job.createdAt ?? 0).getTime(),
}

export default function QuoteBoard({ rows }) {
  const [tab, setTab] = useState('active')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'quoted', dir: 'desc' })

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TABS.map((t) => [t.key, rows.filter((r) => r.bucket === t.key).length]),
      ),
    [rows],
  )

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => {
      if (r.bucket !== tab) return false
      if (!q) return true
      return [
        shortJobRef(r.jobId),
        jobTitle({ type: r.job.type }),
        r.job.pickup,
        r.job.delivery,
        r.notes,
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
    const get = SORTERS[sort.key]
    const dir = sort.dir === 'asc' ? 1 : -1
    return list.sort((a, b) => {
      const va = get(a)
      const vb = get(b)
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir
    })
  }, [rows, tab, query, sort])

  const totalValue = visible.reduce((s, r) => s + r.price, 0)

  const toggleSort = (key) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'job' || key === 'route' ? 'asc' : 'desc' },
    )

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Quotes</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Track where your bids stand and adjust them before the customer decides.
          </p>
        </div>
        <label className="relative block w-full sm:w-64">
          <Search
            size={14}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by ref, suburb or note"
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </label>
      </div>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-1.5 text-[11px] font-semibold ${
                tab === t.key ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {!visible.length ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-14 text-center">
          <p className="text-sm text-gray-400">
            {query ? 'No quotes match that filter.' : `No ${tab} quotes.`}
          </p>
          {tab === 'active' && !query && (
            <Link
              href="/dashboard/carrier/jobs"
              className="mt-3 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Browse available jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-left text-xs font-semibold text-gray-500">
                <SortTh label="Job" k="job" sort={sort} onSort={toggleSort} />
                <SortTh label="Your price" k="price" sort={sort} onSort={toggleSort} right />
                <SortTh label="Bids" k="bids" sort={sort} onSort={toggleSort} right />
                <SortTh label="Position" k="position" sort={sort} onSort={toggleSort} />
                <SortTh label="Messages" k="messages" sort={sort} onSort={toggleSort} right />
                <SortTh label="Route" k="route" sort={sort} onSort={toggleSort} />
                <SortTh label="Quoted" k="quoted" sort={sort} onSort={toggleSort} />
                <SortTh label="Posted" k="created" sort={sort} onSort={toggleSort} />
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  Notes <span className="font-normal text-gray-400">(private)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((r) => (
                <QuoteRow key={r.id} row={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {visible.length > 0 && (
        <p className="mt-3 text-center text-xs text-gray-500">
          {visible.length} quote{visible.length === 1 ? '' : 's'} ·{' '}
          <span className="font-semibold text-gray-700">{formatMoney(totalValue)}</span>{' '}
          total value
        </p>
      )}
    </div>
  )
}

function SortTh({ label, k, sort, onSort, right }) {
  const active = sort.key === k
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className={`whitespace-nowrap px-3 py-2.5 ${right ? 'text-right' : ''}`}>
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1 hover:text-gray-900 ${
          active ? 'text-teal-700' : ''
        }`}
      >
        {label}
        <Icon size={12} className={active ? '' : 'opacity-50'} />
      </button>
    </th>
  )
}

function QuoteRow({ row: r }) {
  const href = `/dashboard/carrier/jobs/${r.jobId}`
  return (
    <tr className="align-top transition-colors hover:bg-gray-50/70">
      <td className="min-w-[130px] px-3 py-2.5">
        <p className="font-mono text-[11px] text-gray-400">#{shortJobRef(r.jobId)}</p>
        <Link href={href} className="font-semibold text-gray-900 hover:text-teal-700 hover:underline">
          {jobTitle({ type: r.job.type })}
        </Link>
      </td>

      <td className="px-3 py-2.5 text-right">
        <p className="font-semibold text-gray-900">{formatMoney(r.price)}</p>
        {r.previousPrice != null && r.previousPrice !== r.price && (
          <p className="text-[11px] text-gray-400 line-through">
            {formatMoney(r.previousPrice)}
          </p>
        )}
      </td>

      <td className="px-3 py-2.5 text-right">
        <p className="text-gray-900">{r.bidCount}</p>
        {r.lowest != null && (
          <p className="text-[11px] italic text-gray-400">Lowest {formatMoney(r.lowest)}</p>
        )}
      </td>

      <td className="px-3 py-2.5">
        <PositionCell row={r} />
      </td>

      <td className="px-3 py-2.5 text-right">
        <Link href={href} className="text-gray-900 hover:text-teal-700">
          {r.messages.mine}
        </Link>
        {r.messages.last && (
          <p className="text-[11px] italic text-gray-400">
            Last: {r.messages.last.fromMe ? 'you' : 'customer'},{' '}
            {relativeTime(r.messages.last.at)}
          </p>
        )}
        <p className="text-[11px] italic text-gray-400">Others: {r.messages.others}</p>
      </td>

      <td className="max-w-[220px] px-3 py-2.5">
        <p className="truncate text-gray-800" title={r.job.pickup}>
          {shortAddress(r.job.pickup)}
        </p>
        <p className="truncate text-gray-500" title={r.job.delivery}>
          → {shortAddress(r.job.delivery)}
        </p>
        <p className="text-[11px] italic text-gray-400">
          {r.job.moveFrom
            ? `${fmtShortDate(r.job.moveFrom)}${
                r.job.moveTo && r.job.moveTo !== r.job.moveFrom
                  ? ` – ${fmtShortDate(r.job.moveTo)}`
                  : ''
              }`
            : 'Flexible date'}
          {r.job.distance != null && ` · ~${r.job.distance} km`}
        </p>
      </td>

      <td className="whitespace-nowrap px-3 py-2.5 bg-gray-50/50">
        <p className="text-gray-800">{fmtDateTime(r.quotedAt)}</p>
        <p className="text-[11px] italic text-gray-400">
          {relativeTime(r.quotedAt)}
          {r.updatedAt && ` · edited ${relativeTime(r.updatedAt)}`}
        </p>
      </td>

      <td className="whitespace-nowrap px-3 py-2.5">
        {r.job.createdAt && (
          <>
            <p className="text-gray-800">{fmtDateTime(r.job.createdAt)}</p>
            <p className="text-[11px] italic text-gray-400">{relativeTime(r.job.createdAt)}</p>
          </>
        )}
      </td>

      <td className="min-w-[180px] px-3 py-2.5">
        <NotesCell quoteId={r.id} initial={r.notes} />
      </td>
    </tr>
  )
}

function PositionCell({ row }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const status = leadStatus(row.price, row.competitorPrices)
  const canAct = row.bucket === 'active'

  async function matchLowest() {
    setBusy(true)
    const res = await fetch(`/api/quotes/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'match_lowest' }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      toast.error(data.error || 'Could not update your price')
      return
    }
    toast.success(`Price matched at ${formatMoney(data.quote?.price ?? data.price)}`)
    router.refresh()
  }

  if (!canAct) {
    return <span className="text-xs text-gray-400">—</span>
  }

  const dot = {
    leading: 'bg-teal-500',
    only: 'bg-teal-500',
    tie: 'bg-gray-500',
    losing: 'bg-red-500',
  }[status.kind]

  return (
    <div className="flex flex-col items-start gap-1">
      <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-800">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {status.kind === 'leading' && (
          <>
            Leading <span className="text-xs text-teal-700">by {formatMoney(status.diff)}</span>
          </>
        )}
        {status.kind === 'only' && 'Only bid'}
        {status.kind === 'tie' && 'Tied lowest'}
        {status.kind === 'losing' && (
          <>
            Behind <span className="text-xs font-semibold text-red-600">+{formatMoney(status.diff)}</span>
          </>
        )}
      </span>
      {status.kind === 'losing' && (
        <button
          onClick={matchLowest}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          <Zap size={11} />
          {busy ? 'Matching…' : `Match ${formatMoney(status.target)}`}
        </button>
      )}
    </div>
  )
}

function NotesCell({ quoteId, initial }) {
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const cancelled = useRef(false)

  async function save() {
    if (cancelled.current || draft.trim() === saved.trim()) {
      setEditing(false)
      return
    }
    setBusy(true)
    const res = await fetch(`/api/quotes/${quoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'notes', notes: draft }),
    })
    setBusy(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast.error(data.error || 'Could not save note')
      return
    }
    setSaved(draft.trim())
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => {
          cancelled.current = false
          setDraft(saved)
          setEditing(true)
        }}
        className={`w-full whitespace-pre-wrap rounded px-1 py-0.5 text-left text-xs hover:bg-gray-100 ${
          saved ? 'text-gray-700' : 'italic text-gray-400'
        }`}
      >
        {saved || 'Add a note'}
      </button>
    )
  }

  return (
    <div>
      <textarea
        autoFocus
        rows={2}
        value={draft}
        disabled={busy}
        maxLength={1000}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            cancelled.current = true
            setEditing(false)
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            save()
          }
        }}
        onBlur={save}
        className="w-full resize-none rounded-md border border-teal-500 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20"
      />
      <p className="text-[10px] text-gray-400">Enter to save · Esc to cancel</p>
    </div>
  )
}
