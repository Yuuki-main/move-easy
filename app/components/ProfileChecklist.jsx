import Link from 'next/link'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'

// "Complete your profile to quote on jobs" — shows what's done and links
// straight to the settings tab for each missing item.
export default function ProfileChecklist({
  checklist,
  title = 'Complete your profile to start quoting',
  intro = "Customers only see quotes from carriers with a complete profile. Finish these steps and you'll be able to quote on jobs.",
}) {
  if (!checklist || checklist.complete) return null
  const { items, doneCount } = checklist
  const pct = Math.round((doneCount / items.length) * 100)

  return (
    <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <p className="mt-0.5 max-w-xl text-sm text-gray-600">{intro}</p>
        </div>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
          {doneCount}/{items.length} done
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-amber-100">
        <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${pct}%` }} />
      </div>

      <ul className="mt-4 space-y-1.5">
        {items.map((item) =>
          item.done ? (
            <li key={item.key} className="flex items-center gap-2.5 px-3 py-1.5 text-sm text-gray-400">
              <CheckCircle2 size={16} className="shrink-0 text-teal-600" />
              <span className="line-through">{item.label}</span>
            </li>
          ) : (
            <li key={item.key}>
              <Link
                href={item.href}
                className="flex items-center gap-2.5 rounded-lg bg-white px-3 py-2 text-sm text-gray-800 ring-1 ring-gray-200 transition-colors hover:ring-teal-500"
              >
                <Circle size={16} className="shrink-0 text-gray-300" />
                <span className="flex-1">{item.label}</span>
                <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-teal-700">
                  Add <ChevronRight size={14} />
                </span>
              </Link>
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
