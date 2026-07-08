import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/uploadToS3'

export async function POST(req) {
  console.log('===== API HIT: /api/jobs/create =====')

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

  // Get request body
  const body = await req.json()

  console.log('[DEBUG] ===== RAW BODY INSPECTION =====')
  console.log('[DEBUG] body keys:', Object.keys(body))
  console.log('[DEBUG] body.photos exists:', 'photos' in body)
  console.log('[DEBUG] body.photos type:', typeof body.photos)
  console.log('[DEBUG] body.photos isArray:', Array.isArray(body.photos))
  console.log('[DEBUG] body.photos length:', body.photos?.length ?? 'NOT AN ARRAY')
  if (Array.isArray(body.photos) && body.photos.length > 0) {
    console.log('[DEBUG] body.photos[0] keys:', Object.keys(body.photos[0]))
    console.log('[DEBUG] body.photos[0].type:', body.photos[0].type)
    console.log('[DEBUG] body.photos[0].base64 length:', body.photos[0].base64?.length ?? 'MISSING')
  }
  console.log('[DEBUG] ===== END RAW BODY =====')

  console.log('[DEBUG] >> About to destructure body...')
  const {
    photos = [],
    items = [],

    // Job type
    jobType,

    // Pickup
    pickupAddress,
    pickupLat,
    pickupLng,
    pickupCity,
    pickupState,
    pickupCountry,
    pickupPostcode,

    // Delivery
    deliveryAddress,
    deliveryLat,
    deliveryLng,
    deliveryCity,
    deliveryState,
    deliveryCountry,
    deliveryPostcode,

    // Date
    moveDateType,
    moveDateFrom,
    moveDateTo,

    // Optional details
    pickupFloor,
    deliveryFloor,
    itemLoading,
    itemUnloading,

    description,
  } = body

  console.log('[DEBUG] >> Destructuring complete')
  console.log('[DEBUG] photos after destructure type:', typeof photos)
  console.log('[DEBUG] photos after destructure isArray:', Array.isArray(photos))
  console.log('[DEBUG] photos after destructure length:', photos?.length ?? 'NOT AN ARRAY')
  console.log('[DEBUG] photos after destructure value:', JSON.stringify(photos?.slice(0, 1)))

  // --------------------------------------------------
  // CREATE JOB
  // Explicit mapping is safer than ...jobData
  // --------------------------------------------------

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      customer_id: user.id,

      type: jobType,

      pickup_address: pickupAddress,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,

      delivery_address: deliveryAddress,
      delivery_lat: deliveryLat,
      delivery_lng: deliveryLng,

      description,

      // Add these ONLY if these columns exist
      move_date_type: moveDateType,
      move_date_from: moveDateFrom,
      move_date_to: moveDateTo,

      pickup_floor: pickupFloor,
      delivery_floor: deliveryFloor,

      item_loading: itemLoading,
      item_unloading: itemUnloading,

      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // --------------------------------------------------
  // CREATE JOB ITEMS
  // --------------------------------------------------

  if (items.length > 0) {
    const formattedItems = items.map((item) => ({
      job_id: job.id,
      name: item.name,
      quantity: item.quantity,
      weight_kg: item.weight_kg,
      length_cm: item.length_cm,
      width_cm: item.width_cm,
      height_cm: item.height_cm,
    }))

    const { error: itemsError } = await supabase
      .from('job_items')
      .insert(formattedItems)

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
  }

  // --------------------------------------------------
  // UPLOAD PHOTOS TO S3
  // --------------------------------------------------

  console.log('[DEBUG] Entering photo upload loop. photos.length =', photos.length)

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    console.log(`[DEBUG] >>> LOOP BODY ENTERED for photo ${i + 1} <<<`)
    try {
      console.log(`[DEBUG] --- Photo ${i + 1}/${photos.length} ---`)
      console.log(`[DEBUG] Photo type:`, photo.type)
      console.log(`[DEBUG] Photo base64 length:`, photo.base64?.length ?? 'MISSING')

      const buffer = Buffer.from(photo.base64, 'base64')
      console.log(`[DEBUG] Buffer created, size:`, buffer.length, 'bytes')
      console.log('[DEBUG] Calling uploadToS3()...')

      const { key, url } = await uploadToS3({
        buffer,
        fileName: `${job.id}-${Math.random().toString(36).slice(2)}.jpg`,
        mimeType: photo.type,
        folder: `job-photos/${job.id}`,
      })

      console.log('[DEBUG] uploadToS3() returned successfully')
      console.log('[DEBUG] S3 key:', key)
      console.log('[DEBUG] S3 url:', url)

      console.log('[DEBUG] Inserting into job_photos...')
      const { data: insertedPhoto, error: photoInsertError } = await supabase
        .from('job_photos')
        .insert({
          job_id: job.id,
          storage_path: key,
          url,
        })
        .select()
        .single()

      console.log('[DEBUG] Insert result:', {
        data: insertedPhoto,
        error: photoInsertError
          ? JSON.stringify(photoInsertError)
          : null,
      })

      if (photoInsertError) {
        console.error(
          '[DEBUG] job_photos insert FAILED:',
          JSON.stringify(photoInsertError, null, 2),
        )
      } else {
        console.log(`[DEBUG] ✅ Photo ${i + 1} saved to DB successfully`)
      }

      console.log(`[DEBUG] --- Finished photo ${i + 1} ---`)
    } catch (err) {
      console.error(`[DEBUG] ❌ Photo ${i + 1} upload ERROR:`, err)
      console.error('[DEBUG] Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    }
  }

  console.log('[DEBUG] Photo upload loop finished')

  return NextResponse.json({
    success: true,
    jobId: job.id,
  })
}
