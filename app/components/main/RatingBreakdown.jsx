import { createClient } from '@/lib/supabase/server'
import RatingBreakdownAnimated from './RatingBreakdownAnimated'

export default async function RatingBreakdown() {
  const supabase = await createClient()

  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating')

  if (error || !reviews || reviews.length === 0) return null

  const total = reviews.length
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / total

  const bins = { excellent: 0, great: 0, average: 0, poor: 0 }
  reviews.forEach((r) => {
    if (r.rating >= 8) bins.excellent++
    else if (r.rating >= 6) bins.great++
    else if (r.rating >= 4) bins.average++
    else bins.poor++
  })

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-[1600px] mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2 text-center">
          India&apos;s most trusted moving marketplace
        </h2>
        <p className="text-gray-400 text-sm mb-10 text-center">
          Rated by thousands of customers across India.
        </p>
        <RatingBreakdownAnimated avg={avg} total={total} bins={bins} />
      </div>
    </section>
  )
}
