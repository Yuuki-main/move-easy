import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadToS3 } from '@/lib/uploadToS3'

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

  // Get request body
  const body = await req.json()

  const {
    photos = [],
    items = [],

    // Job type
    jobType,

    // Pickup
    pickupAddress,
    pickupLat,
    pickupLng,

    // Delivery
    deliveryAddress,
    deliveryLat,
    deliveryLng,

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

  for (const photo of photos) {
    try {
      const buffer = Buffer.from(photo.base64, 'base64')

      const { key, url } = await uploadToS3({
        buffer,
        fileName: `${job.id}-${Math.random().toString(36).slice(2)}.jpg`,
        mimeType: photo.type,
        folder: `job-photos/${job.id}`,
      })

      await supabase.from('job_photos').insert({
        job_id: job.id,
        storage_path: key,
        url,
      })
    } catch (err) {
      console.error('S3 upload error:', err)
    }
  }

  return NextResponse.json({
    success: true,
    jobId: job.id,
  })
}
