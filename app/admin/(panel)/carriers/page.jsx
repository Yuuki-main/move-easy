import { createServiceClient } from '@/lib/supabase/service-role'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

const STATUS_STYLES = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
}

export default async function AdminCarriersPage() {
  const supabase = createServiceClient()

  const { data: carriers } = await supabase
    .from('carrier_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Carrier Applications</h1>

      {!carriers?.length ? (
        <p className="text-gray-400 text-sm text-center py-20">
          No carriers yet.
        </p>
      ) : (
        <div className="space-y-3">
          {carriers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/carriers/${c.id}`}
              className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-400 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-800">
                      {c.public_name}
                    </p>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        STATUS_STYLES[c.application_status] ??
                        'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {c.application_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {c.legal_company_name}
                  </p>
                  <div className="flex gap-4 mt-1.5 text-xs text-gray-400">
                    {c.email && <span>{c.email}</span>}
                    {c.phone && <span>{c.phone}</span>}
                  </div>
                </div>
                <ChevronRight
                  size={18}
                  className="text-gray-300 group-hover:text-blue-500 transition-colors"
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
