import { createClient } from '@/lib/supabase/server'

export default async function RecentReviews() {
  const supabase = await createClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating, comment, created_at, carrier_profiles(public_name)')
    .order('created_at', { ascending: false })
    .limit(6)

  if (!reviews?.length) return null

  return (
    <section className="px-4 py-16 bg-gray-50">
      <h2 className="text-2xl font-bold text-center mb-10">
        What customers are saying
      </h2>
      <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white rounded-xl border p-5">
            <p className="text-yellow-500 font-bold mb-2">⭐ {r.rating}/10</p>
            {r.comment && (
              <p className="text-sm text-gray-600 mb-2">{r.comment}</p>
            )}
            <p className="text-xs text-gray-400">
              for {r.carrier_profiles?.public_name ?? 'a carrier'}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
