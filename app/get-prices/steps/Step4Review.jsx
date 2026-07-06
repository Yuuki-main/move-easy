'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const JOB_TYPE_LABELS = {
  home_move: 'Home Move',
  office_move: 'Office Move',
  storage_move: 'Storage Move',
  furniture: 'Furniture',
  item: 'Parcel / Item',
  car: 'Car',
  motorcycle: 'Motorcycle',
  other_vehicle: 'Other Vehicle',
  boat: 'Boat',
  piano: 'Piano',
  pet: 'Pet Transport',
  junk: 'Junk Removal',
  other: 'Other',
}

function formatDate(d) {
  if (!d) return ''

  return new Date(d).toLocaleDateString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function Step4Review({ wizard }) {
  const { state, prevStep } = wizard

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const submit = async () => {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login?redirect=/get-prices')
        return
      }

      const photos = await Promise.all(
        state.photos.map(async (file) => {
          const buffer = await file.arrayBuffer()

          return {
            base64: Buffer.from(buffer).toString('base64'),
            type: file.type,
          }
        }),
      )

      const payload = {
        // Job type
        jobType: state.jobType,

        // Pickup
        pickupAddress: state.pickupAddress,
        pickupLat: state.pickupLat,
        pickupLng: state.pickupLng,

        // Delivery
        deliveryAddress: state.deliveryAddress,
        deliveryLat: state.deliveryLat,
        deliveryLng: state.deliveryLng,

        // Date
        moveDateType: state.moveDateType,
        moveDateFrom: state.moveDateFrom,
        moveDateTo: state.moveDateTo,

        // Details
        pickupFloor: state.pickupFloor,
        deliveryFloor: state.deliveryFloor,

        itemLoading: state.itemLoading,
        itemUnloading: state.itemUnloading,

        description: state.description,

        items: state.items,
        photos,
      }

      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong.')
        setLoading(false)
        return
      }

      //   router.push(`/dashboard/customer/jobs/${data.jobId}?new=true`)
      router.push(`/dashboard/jobs/${data.jobId}?new=true`)
    } catch (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const moveDateDisplay = () => {
    switch (state.moveDateType) {
      case 'flexible':
        return 'Flexible'

      case 'asap':
        return 'ASAP'

      case 'specific':
        return formatDate(state.moveDateFrom) || 'Not set'

      case 'between':
        return `${formatDate(state.moveDateFrom) || '?'} — ${
          formatDate(state.moveDateTo) || '?'
        }`

      default:
        return 'Flexible'
    }
  }

  return (
    <div>
      <button
        onClick={prevStep}
        className="mb-6 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">
        Review your request
      </h2>

      <p className="text-sm text-gray-500 mb-8">
        Confirm the details before submitting.
      </p>

      <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="flex items-start justify-between px-4 py-3.5 border-b border-gray-100">
          <span className="text-sm text-gray-500">Job type</span>

          <span className="text-sm font-semibold text-gray-900">
            {JOB_TYPE_LABELS[state.jobType] ?? state.jobType?.replace('_', ' ')}
          </span>
        </div>

        <div className="px-4 py-3.5 border-b border-gray-100 space-y-2">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-700 font-bold">
              A
            </span>

            <span className="text-sm text-gray-800 font-medium">
              {state.pickupAddress}
            </span>
          </div>

          <div className="ml-2.5 h-4 w-px bg-gray-200" />

          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-700 font-bold">
              B
            </span>

            <span className="text-sm text-gray-800 font-medium">
              {state.deliveryAddress}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <span className="text-sm text-gray-500">Move date</span>

          <span className="text-sm font-semibold text-gray-900">
            {moveDateDisplay()}
          </span>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <span className="text-sm text-gray-500">Pickup details</span>

          <span className="text-sm font-semibold text-gray-900 text-right">
            {state.pickupFloor} · {state.itemLoading}
          </span>
        </div>

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
          <span className="text-sm text-gray-500">Delivery details</span>

          <span className="text-sm font-semibold text-gray-900 text-right">
            {state.deliveryFloor} · {state.itemUnloading}
          </span>
        </div>

        <div className="px-4 py-3.5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Items</span>

            <span className="text-sm font-semibold text-gray-900">
              {state.items.length > 0
                ? `${state.items.length} item(s)`
                : 'None added'}
            </span>
          </div>

          {state.items.length > 0 && (
            <div className="space-y-1 mt-1">
              {state.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-gray-500"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-[10px]">
                    {item.quantity}
                  </span>

                  {item.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-gray-500">Photos</span>

          <span className="text-sm font-semibold text-gray-900">
            {state.photos.length > 0
              ? `${state.photos.length} photo(s)`
              : 'None'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit & Get Quotes'}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        Free to submit — movers will send you their best prices.
      </p>
    </div>
  )
}

// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import { createClient } from '@/lib/supabase/client'

// const JOB_TYPE_LABELS = {
//   home_move: 'Home Move',
//   office_move: 'Office Move',
//   storage_move: 'Storage Move',
//   furniture: 'Furniture',
//   item: 'Parcel / Item',
//   car: 'Car',
//   motorcycle: 'Motorcycle',
//   other_vehicle: 'Other Vehicle',
//   boat: 'Boat',
//   piano: 'Piano',
//   pet: 'Pet Transport',
//   junk: 'Junk Removal',
//   other: 'Other',
// }

// const DATE_TYPE_LABELS = {
//   flexible: 'Flexible',
//   asap: 'ASAP',
//   specific: 'Specific date',
//   between: 'Between dates',
// }

// function formatDate(d) {
//   if (!d) return ''
//   return new Date(d).toLocaleDateString('en-NZ', {
//     weekday: 'short',
//     day: 'numeric',
//     month: 'short',
//     year: 'numeric',
//   })
// }

// export default function Step4Review({ wizard }) {
//   const { state, prevStep } = wizard

//   const [loading, setLoading] = useState(false)
//   const [error, setError] = useState('')

//   const router = useRouter()
//   const supabase = createClient()

//   const submit = async () => {
//     try {
//       setLoading(true)
//       setError('')

//       const {
//         data: { user },
//       } = await supabase.auth.getUser()

//       if (!user) {
//         router.push('/login?redirect=/get-prices')
//         return
//       }

//       const photos = await Promise.all(
//         state.photos.map(async (file) => {
//           const buffer = await file.arrayBuffer()
//           return {
//             base64: Buffer.from(buffer).toString('base64'),
//             type: file.type,
//           }
//         }),
//       )

//       const res = await fetch('/api/jobs/create', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           jobType: state.jobType,
//           pickup_address: state.pickupAddress,
//           pickup_lat: state.pickupLat,
//           pickup_lng: state.pickupLng,
//           delivery_address: state.deliveryAddress,
//           delivery_lat: state.deliveryLat,
//           delivery_lng: state.deliveryLng,
//           moveDateType: state.moveDateType,
//           moveDateFrom: state.moveDateFrom,
//           moveDateTo: state.moveDateTo,
//           pickupFloor: state.pickupFloor,
//           deliveryFloor: state.deliveryFloor,
//           itemLoading: state.itemLoading,
//           itemUnloading: state.itemUnloading,
//           description: state.description,
//           items: state.items,
//           photos,
//         }),
//       })

//       const data = await res.json()

//       if (data.error) {
//         setError('Something went wrong. Try again.')
//         setLoading(false)
//         return
//       }

//       router.push(`/dashboard/customer/jobs/${data.jobId}?new=true`)
//     } catch (err) {
//       console.error(err)
//       setError('Something went wrong. Try again.')
//       setLoading(false)
//     }
//   }

//   const moveDateDisplay = () => {
//     switch (state.moveDateType) {
//       case 'flexible':
//         return 'Flexible'
//       case 'asap':
//         return 'ASAP'
//       case 'specific':
//         return formatDate(state.moveDateFrom) || 'Not set'
//       case 'between':
//         return `${formatDate(state.moveDateFrom) || '?'} — ${formatDate(state.moveDateTo) || '?'}`
//       default:
//         return 'Flexible'
//     }
//   }

//   return (
//     <div>
//       <button
//         onClick={prevStep}
//         className="mb-6 flex items-center gap-1 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
//       >
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           className="h-4 w-4"
//           viewBox="0 0 20 20"
//           fill="currentColor"
//         >
//           <path
//             fillRule="evenodd"
//             d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
//             clipRule="evenodd"
//           />
//         </svg>
//         Back
//       </button>

//       <h2 className="text-2xl font-bold text-gray-900 mb-1">
//         Review your request
//       </h2>
//       <p className="text-sm text-gray-500 mb-8">
//         Confirm the details before submitting.
//       </p>

//       <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
//         {/* Job type */}
//         <div className="flex items-start justify-between px-4 py-3.5 border-b border-gray-100">
//           <span className="text-sm text-gray-500">Job type</span>
//           <span className="text-sm font-semibold text-gray-900">
//             {JOB_TYPE_LABELS[state.jobType] ?? state.jobType?.replace('_', ' ')}
//           </span>
//         </div>

//         {/* Route */}
//         <div className="px-4 py-3.5 border-b border-gray-100 space-y-2">
//           <div className="flex items-start gap-3">
//             <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs text-green-700 font-bold">
//               A
//             </span>
//             <span className="text-sm text-gray-800 font-medium">
//               {state.pickupAddress}
//             </span>
//           </div>
//           <div className="ml-2.5 h-4 w-px bg-gray-200" />
//           <div className="flex items-start gap-3">
//             <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs text-red-700 font-bold">
//               B
//             </span>
//             <span className="text-sm text-gray-800 font-medium">
//               {state.deliveryAddress}
//             </span>
//           </div>
//         </div>

//         {/* Move date type + dates */}
//         <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
//           <span className="text-sm text-gray-500">Move date</span>
//           <span className="text-sm font-semibold text-gray-900">
//             {moveDateDisplay()}
//           </span>
//         </div>

//         {/* Pickup floor + loading */}
//         <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
//           <span className="text-sm text-gray-500">Pickup details</span>
//           <span className="text-sm font-semibold text-gray-900 text-right">
//             {state.pickupFloor} &middot; {state.itemLoading}
//           </span>
//         </div>

//         {/* Delivery floor + unloading */}
//         <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
//           <span className="text-sm text-gray-500">Delivery details</span>
//           <span className="text-sm font-semibold text-gray-900 text-right">
//             {state.deliveryFloor} &middot; {state.itemUnloading}
//           </span>
//         </div>

//         {/* Items */}
//         <div className="px-4 py-3.5 border-b border-gray-100">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-sm text-gray-500">Items</span>
//             <span className="text-sm font-semibold text-gray-900">
//               {state.items.length > 0
//                 ? `${state.items.length} item(s)`
//                 : 'None added'}
//             </span>
//           </div>
//           {state.items.length > 0 && (
//             <div className="space-y-1 mt-1">
//               {state.items.map((item, i) => (
//                 <div
//                   key={i}
//                   className="flex items-center gap-2 text-xs text-gray-500"
//                 >
//                   <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-medium text-[10px]">
//                     {item.quantity}
//                   </span>
//                   {item.name}
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Photos */}
//         <div className="flex items-center justify-between px-4 py-3.5">
//           <span className="text-sm text-gray-500">Photos</span>
//           <span className="text-sm font-semibold text-gray-900">
//             {state.photos.length > 0
//               ? `${state.photos.length} photo(s)`
//               : 'None'}
//           </span>
//         </div>
//       </div>

//       {error && (
//         <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
//           {error}
//         </div>
//       )}

//       <button
//         onClick={submit}
//         disabled={loading}
//         className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
//       >
//         {loading ? 'Submitting...' : 'Submit & Get Quotes'}
//       </button>

//       <p className="mt-3 text-center text-xs text-gray-400">
//         Free to submit — movers will send you their best prices.
//       </p>
//     </div>
//   )
// }
