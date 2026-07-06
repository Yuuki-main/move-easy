import { createClient } from '@/lib/supabase/server'
import ApprovalButtons from './ApprovalButtons'

export default async function AdminCarriersPage() {
  const supabase = await createClient()

  const { data: carriers } = await supabase
    .from('carrier_profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Carrier Applications</h1>
      <div className="space-y-3">
        {carriers?.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-gray-800">{c.public_name}</p>
                <p className="text-xs text-gray-400">
                  {c.legal_company_name} · {c.city}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full
                ${c.application_status === 'active' ? 'bg-green-100 text-green-700' : ''}
                ${c.application_status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${c.application_status === 'rejected' ? 'bg-red-100 text-red-700' : ''}
              `}
              >
                {c.application_status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">
              {c.profile_description}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.service_categories?.map((cat) => (
                <span
                  key={cat}
                  className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full capitalize"
                >
                  {cat.replace('_', ' ')}
                </span>
              ))}
            </div>
            {c.application_status === 'pending' && (
              <ApprovalButtons carrierId={c.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
