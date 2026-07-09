import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RecentReviewsAnimated from './RecentReviewsAnimated'

export default async function RecentReviews() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(
      `
      id,
      rating,
      comment,
      created_at,
      carrier_id,
      carrier_profiles ( public_name ),
      jobs ( pickup_address, delivery_address, type )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(6)

  if (!reviews || reviews.length === 0) return null

  const prepared = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    created_at: r.created_at,
    carrierId: r.carrier_id,
    carrierName: r.carrier_profiles?.public_name ?? null,
    route: r.jobs
      ? { from: r.jobs.pickup_address, to: r.jobs.delivery_address }
      : null,
  }))

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
          What our customers say
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Real reviews from real moves across New Zealand.
        </p>

        <RecentReviewsAnimated reviews={prepared} />

        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline"
          >
            Load more reviews →
          </Link>
        </div>
      </div>
    </section>
  )
}
