'use client'

import { useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { formatMoney } from '@/lib/quotes'

// Every live bid on the job, cheapest first. The carrier's own row expands
// into a preview of their quote as the customer sees it (passed as children).
export default function JobBids({ bids, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-400">
          {bids.length} bid{bids.length === 1 ? '' : 's'} · cheapest first
        </p>
      </div>

      <ol className="space-y-1.5">
        {bids.map((bid, i) => {
          const isOpen = bid.isMine && open
          return (
            <li key={bid.id}>
              <div
                role={bid.isMine ? 'button' : undefined}
                tabIndex={bid.isMine ? 0 : undefined}
                onClick={bid.isMine ? () => setOpen((o) => !o) : undefined}
                onKeyDown={
                  bid.isMine
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setOpen((o) => !o)
                        }
                      }
                    : undefined
                }
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-2.5 text-sm transition-colors ${
                  bid.isMine
                    ? `cursor-pointer border border-teal-500 bg-teal-50/60 hover:bg-teal-50 ${isOpen ? 'rounded-b-none' : ''}`
                    : 'border border-transparent bg-gray-100/80'
                }`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-gray-400">{i + 1}.</span>
                  <span className="truncate font-medium text-gray-900">{bid.name}</span>
                  {bid.rating > 0 && (
                    <span className="rounded bg-gray-900 px-1 py-px text-[10px] font-bold text-white">
                      {Number(bid.rating).toFixed(1)}
                    </span>
                  )}
                  {bid.isMine && (
                    <span className="rounded-full bg-teal-600 px-2 py-px text-[10px] font-semibold uppercase tracking-wide text-white">
                      You
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {bid.messages > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                      <MessageSquare size={12} />
                      {bid.messages}
                    </span>
                  )}
                  <span className="font-semibold text-gray-900">{formatMoney(bid.price)}</span>
                  {bid.isMine && (
                    <ChevronDown
                      size={16}
                      className={`text-teal-700 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>
              </div>
              {isOpen && (
                <div className="rounded-b-lg border border-t-0 border-teal-500 bg-white">
                  {children}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
