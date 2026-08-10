import { createServiceClient } from '@/lib/supabase/service-role'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import ReviewButton from './ReviewButton'
import ApprovalButtons from '../ApprovalButtons'

export default async function CarrierDetailPage({ params }) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!carrier) {
    return (
      <div>
        <Link
          href="/admin/carriers"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft size={16} />
          Back to carriers
        </Link>
        <p className="text-gray-400 text-sm">Carrier not found.</p>
      </div>
    )
  }

  // Fetch auth user email via Admin API (service_role key)
  let authEmail = null
  let authPhone = null
  try {
    const { data: authUser } = await supabase.auth.admin.getUserById(id)
    if (authUser?.user) {
      authEmail = authUser.user.email
      authPhone = authUser.user.phone
    }
  } catch (_) {
    // auth.admin may not be available in some SDK versions
  }

  // Fetch profile data that might have phone
  const { data: profile } = await supabase
    .from('profiles')
    .select('phone, first_name, last_name')
    .eq('id', id)
    .maybeSingle()

  const { data: documents } = await supabase
    .from('carrier_documents')
    .select('*')
    .eq('carrier_id', id)
    .order('created_at', { ascending: false })

  const { data: insurance } = await supabase
    .from('carrier_insurance')
    .select('*')
    .eq('carrier_id', id)
    .order('created_at', { ascending: false })

  const email = authEmail || '—'
  const phone = carrier.phone || authPhone || profile?.phone || '—'

  // Parse photos array from carrier_profiles
  const photos = Array.isArray(carrier.photos) ? carrier.photos : []

  return (
    <div>
      <Link
        href="/admin/carriers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ChevronLeft size={16} />
        Back to carriers
      </Link>

      {/* Profile section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {carrier.public_name}
          </h1>
          <div className="flex items-center gap-3">
            <span
              className={`inline-block text-xs font-semibold px-2.5 py-1.5 rounded-full ${
                carrier.application_status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : carrier.application_status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {carrier.application_status}
            </span>
            <ApprovalButtons
              carrierId={carrier.id}
              currentStatus={carrier.application_status}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400 mb-0.5">Email</p>
            <p className="text-gray-800">{email}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Phone</p>
            <p className="text-gray-800">{phone}</p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Company</p>
            <p className="text-gray-800">
              {carrier.legal_company_name || '—'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 mb-0.5">Location</p>
            <p className="text-gray-800">
              {[carrier.city, carrier.region, carrier.postcode]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-gray-400 mb-0.5">Profile Description</p>
            <p className="text-gray-800">
              {carrier.profile_description || '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Photos section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Photos {photos.length > 0 && <span className="text-sm font-normal text-gray-400 ml-1">({photos.length})</span>}
        </h2>
        {photos.length === 0 ? (
          <p className="text-sm text-gray-400">No photos uploaded.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200 hover:border-blue-400 transition-colors"
              >
                <img
                  src={url}
                  alt={`Carrier photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Documents section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Documents</h2>
        {!documents?.length ? (
          <p className="text-sm text-gray-400">No documents uploaded.</p>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg p-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {doc.document_type?.replace(/_/g, ' ')}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View file →
                    </a>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        doc.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'disapproved'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                    {doc.reviewed_at && (
                      <span className="text-xs text-gray-400">
                        Reviewed:{' '}
                        {new Date(doc.reviewed_at).toLocaleDateString('en-NZ')}
                      </span>
                    )}
                  </div>
                </div>
                {doc.status === 'pending' && (
                  <ReviewButton
                    type="document"
                    id={doc.id}
                    carrierId={carrier.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Insurance section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Insurance</h2>
        {!insurance?.length ? (
          <p className="text-sm text-gray-400">
            No insurance policies uploaded.
          </p>
        ) : (
          <div className="space-y-3">
            {insurance.map((ins) => (
              <div
                key={ins.id}
                className="flex items-center justify-between border border-gray-100 rounded-lg p-4"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {ins.provider_name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {ins.coverage_amount && (
                      <span className="text-xs text-gray-500">
                        ${Number(ins.coverage_amount).toLocaleString()}
                      </span>
                    )}
                    {ins.proof_url && (
                      <a
                        href={ins.proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View proof →
                      </a>
                    )}
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        ins.status === 'approved'
                          ? 'bg-green-100 text-green-700'
                          : ins.status === 'disapproved'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {ins.status}
                    </span>
                    {ins.reviewed_at && (
                      <span className="text-xs text-gray-400">
                        Reviewed:{' '}
                        {new Date(ins.reviewed_at).toLocaleDateString('en-NZ')}
                      </span>
                    )}
                  </div>
                </div>
                {ins.status === 'pending' && (
                  <ReviewButton
                    type="insurance"
                    id={ins.id}
                    carrierId={carrier.id}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
