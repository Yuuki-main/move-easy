import { supabaseAdmin } from '@/lib/supabase/admin'

// What a carrier must have before they can quote on jobs. Uploaded documents
// count unless an admin has rejected them (rejected → upload a new one).
const ID_TYPES = ['identity', 'driving_license']
const MIN_DESCRIPTION = 30

const SETTINGS = '/dashboard/carrier/settings'

export function buildChecklist({ carrier, documents = [], insurance = [], telephones = [] }) {
  const live = (rows) => rows.filter((r) => r.status !== 'disapproved')
  const items = [
    {
      key: 'description',
      label: 'Write a short business description',
      done: (carrier?.profile_description ?? '').trim().length >= MIN_DESCRIPTION,
      href: `${SETTINGS}?tab=profile`,
    },
    {
      key: 'phone',
      label: 'Add a phone number',
      done: telephones.length > 0 || Boolean(carrier?.phone),
      href: `${SETTINGS}?tab=telephone`,
    },
    {
      key: 'photo',
      label: 'Upload at least one photo of your truck or team',
      done: (carrier?.photos ?? []).length > 0,
      href: `${SETTINGS}?tab=photos`,
    },
    {
      key: 'id',
      label: 'Upload ID (driving licence or passport)',
      done: live(documents).some((d) => ID_TYPES.includes(d.document_type)),
      href: `${SETTINGS}?tab=verification`,
    },
    {
      key: 'insurance',
      label: 'Add your insurance policy',
      done: live(insurance).length > 0,
      href: `${SETTINGS}?tab=insurance`,
    },
  ]
  const missing = items.filter((i) => !i.done)
  return { items, missing, complete: missing.length === 0, doneCount: items.length - missing.length }
}

// Checklists for many carriers in 4 queries (used for emails and admin lists).
export async function loadChecklists(carrierIds) {
  if (!carrierIds.length) return {}
  const [{ data: carriers }, { data: docs }, { data: policies }, { data: phones }] =
    await Promise.all([
      supabaseAdmin
        .from('carrier_profiles')
        .select('id, profile_description, phone, photos')
        .in('id', carrierIds),
      supabaseAdmin
        .from('carrier_documents')
        .select('carrier_id, document_type, status')
        .in('carrier_id', carrierIds),
      supabaseAdmin.from('carrier_insurance').select('carrier_id, status').in('carrier_id', carrierIds),
      supabaseAdmin.from('carrier_telephones').select('carrier_id').in('carrier_id', carrierIds),
    ])

  const by = (rows, id) => (rows ?? []).filter((r) => r.carrier_id === id)
  return Object.fromEntries(
    (carriers ?? []).map((c) => [
      c.id,
      buildChecklist({
        carrier: c,
        documents: by(docs, c.id),
        insurance: by(policies, c.id),
        telephones: by(phones, c.id),
      }),
    ]),
  )
}

export async function loadChecklist(carrierId) {
  return (await loadChecklists([carrierId]))[carrierId] ?? buildChecklist({})
}
