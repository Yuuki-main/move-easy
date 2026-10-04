import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3, inspectUpload, UploadError } from '@/lib/uploadToS3'
import { sendEmailBatch } from '@/lib/email'
import { newJobForCarrier } from '@/lib/email-templates'
import { getUserContact } from '@/lib/users'
import { loadChecklists } from '@/lib/carrier-profile'
import { notifyMany } from '@/lib/notifications'
import { MAX_JOB_PHOTOS } from '@/lib/upload-rules'
import { supabaseAdmin } from '@/lib/supabase/admin'

const MAX_ITEMS = 100
const MAX_DESCRIPTION = 2000

const str = (v, max = 300) => (v == null ? null : String(v).trim().slice(0, max) || null)
const num = (v) => (v === '' || v == null || !Number.isFinite(Number(v)) ? null : Number(v))

export async function POST(req) {
  // Create Supabase server client
  const supabase = await createClient()

  // Get logged in user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // User must be logged in
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })
  }

  // Carriers are not permitted to create jobs
  const { data: carrierProfile } = await supabase
    .from('carrier_profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (carrierProfile) {
    return NextResponse.json(
      { error: 'Carrier accounts cannot create delivery requests.' },
      { status: 403 },
    )
  }

  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const {
    photos = [],
    items = [],
    jobType,
    pickupAddress,
    pickupLat,
    pickupLng,
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    moveDateType,
    moveDateFrom,
    moveDateTo,
    pickupFloor,
    deliveryFloor,
    itemLoading,
    itemUnloading,
    description,
  } = body

  // --------------------------------------------------
  // VALIDATE (before anything is written)
  // --------------------------------------------------

  if (!str(jobType, 60) || !str(pickupAddress) || !str(deliveryAddress)) {
    return NextResponse.json(
      { error: 'Job type, pickup and delivery address are required' },
      { status: 400 },
    )
  }
  if (!Array.isArray(items) || items.length > MAX_ITEMS) {
    return NextResponse.json({ error: `Add up to ${MAX_ITEMS} items` }, { status: 400 })
  }
  if (!Array.isArray(photos) || photos.length > MAX_JOB_PHOTOS) {
    return NextResponse.json(
      { error: `You can add up to ${MAX_JOB_PHOTOS} photos` },
      { status: 400 },
    )
  }

  // Decode + check every photo up front so a bad file never leaves a half-created job
  let photoBuffers
  try {
    photoBuffers = photos.map((photo) => {
      const buffer = Buffer.from(String(photo?.base64 ?? ''), 'base64')
      inspectUpload(buffer)
      return buffer
    })
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: `Photo rejected: ${err.message}` }, { status: 400 })
    }
    throw err
  }

  // --------------------------------------------------
  // CREATE JOB
  // --------------------------------------------------

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      customer_id: user.id,
      type: str(jobType, 60),

      pickup_address: str(pickupAddress),
      pickup_lat: num(pickupLat),
      pickup_lng: num(pickupLng),

      delivery_address: str(deliveryAddress),
      delivery_lat: num(deliveryLat),
      delivery_lng: num(deliveryLng),

      description: str(description, MAX_DESCRIPTION),

      move_date_type: str(moveDateType, 40),
      move_date_from: moveDateFrom || null,
      move_date_to: moveDateTo || null,

      pickup_floor: str(pickupFloor, 40),
      delivery_floor: str(deliveryFloor, 40),

      item_loading: str(itemLoading, 40),
      item_unloading: str(itemUnloading, 40),

      status: 'open',
    })
    .select()
    .single()

  if (error) {
    console.error('[jobs/create] Job insert failed:', error.message)
    return NextResponse.json({ error: 'Could not create your request' }, { status: 500 })
  }

  // --------------------------------------------------
  // CREATE JOB ITEMS
  // --------------------------------------------------

  if (items.length > 0) {
    const formattedItems = items.map((item) => ({
      job_id: job.id,
      name: str(item?.name, 120),
      quantity: Math.max(1, Math.min(999, Math.round(num(item?.quantity) ?? 1))),
      weight_kg: num(item?.weight_kg),
      length_cm: num(item?.length_cm),
      width_cm: num(item?.width_cm),
      height_cm: num(item?.height_cm),
    }))

    const { error: itemsError } = await supabase
      .from('job_items')
      .insert(formattedItems)

    if (itemsError) {
      // Don't leave an item-less job behind; the customer can resubmit.
      await supabaseAdmin.from('jobs').delete().eq('id', job.id)
      console.error('[jobs/create] Items insert failed:', itemsError.message)
      return NextResponse.json({ error: 'Could not save your items' }, { status: 500 })
    }
  }

  // --------------------------------------------------
  // UPLOAD PHOTOS TO S3 (already validated)
  // --------------------------------------------------

  let failedPhotos = 0
  for (const buffer of photoBuffers) {
    try {
      const { key, url } = await uploadToS3({ buffer, folder: `job-photos/${job.id}` })
      const { error: photoInsertError } = await supabase
        .from('job_photos')
        .insert({ job_id: job.id, storage_path: key, url })
      if (photoInsertError) throw new Error(photoInsertError.message)
    } catch (err) {
      failedPhotos += 1
      console.error('[jobs/create] Photo upload failed:', err.message)
    }
  }

  // --------------------------------------------------
  // NOTIFY MATCHING CARRIERS (non-blocking — job is already saved)
  // --------------------------------------------------
  try {
    await notifyCarriers(job)
  } catch (emailErr) {
    console.error('[jobs/create] Carrier notification failed:', emailErr.message)
  }

  return NextResponse.json({
    success: true,
    jobId: job.id,
    failedPhotos,
  })
}

// Email EVERY carrier (approved or awaiting approval) about the new job,
// except those who turned job emails off. Carriers who can't quote yet get
// told exactly what to finish. Also adds an in-app notification.
async function notifyCarriers(job) {
  const [{ data: carriers, error }, { data: prefs }] = await Promise.all([
    supabaseAdmin
      .from('carrier_profiles')
      .select('id, public_name, application_status')
      .in('application_status', ['active', 'pending']),
    supabaseAdmin
      .from('carrier_notification_preferences')
      .select('carrier_id, email_frequency'),
  ])
  if (error) throw new Error(`Carrier fetch failed: ${error.message}`)

  const optedOut = new Set(
    (prefs ?? []).filter((p) => p.email_frequency === 'never').map((p) => p.carrier_id),
  )
  const targets = (carriers ?? []).filter((c) => !optedOut.has(c.id))
  if (!targets.length) return

  const ids = targets.map((c) => c.id)
  const [checklists, contacts] = await Promise.all([
    loadChecklists(ids),
    // Emails live in auth.users, not carrier_profiles
    Promise.all(ids.map((id) => getUserContact(id))),
  ])

  const messages = targets
    .map((carrier, i) =>
      contacts[i]
        ? {
            to: contacts[i].email,
            ...newJobForCarrier({
              carrierName: carrier.public_name,
              job,
              pending: carrier.application_status === 'pending',
              missingSteps: (checklists[carrier.id]?.missing ?? []).map((m) => m.label),
            }),
          }
        : null,
    )
    .filter(Boolean)

  const jobLabel = String(job.type ?? 'move').replace(/_/g, ' ')
  await Promise.all([
    messages.length ? sendEmailBatch(messages) : null,
    notifyMany(ids, {
      type: 'new_job',
      title: `New ${jobLabel} request`,
      content: [job.pickup_address, job.delivery_address]
        .map((a) => String(a ?? '').split(',').slice(-2).join(',').trim())
        .join(' → '),
      link: `/dashboard/carrier/jobs/${job.id}`,
      jobId: job.id,
    }),
  ])
  console.info(`[jobs/create] New-job email sent to ${messages.length} carrier(s)`)
}
