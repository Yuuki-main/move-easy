import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import MovingHero from '@/components/main/MovingHero'
import PopularServices from '@/components/main/PopularServices'
import RecentReviews from '@/components/main/RecentReviews'
import RatingBreakdown from '@/components/main/RatingBreakdown'
import WhyChooseUs from '@/components/main/WhyChooseUs'
import HowItWorks from '@/components/main/HowItWorks'
import FAQSection from '@/components/FAQSection'
import CTASectionAnimated from '@/components/main/CTASectionAnimated'

export const revalidate = 60

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-[#e8e8e8] rounded-2xl ${className}`} />
  )
}

async function HeroWithRating() {
  const supabase = await createClient()

  const { count, data } = await supabase
    .from('reviews')
    .select('rating', { count: 'exact', head: false })
    .limit(1000)

  let avgRating = null
  let reviewCount = count || 0

  if (data && data.length > 0) {
    avgRating = data.reduce((s, r) => s + r.rating, 0) / data.length
  }

  return <MovingHero reviewCount={reviewCount} avgRating={avgRating} />
}

export default function Home() {
  return (
    <>
      <Suspense
        fallback={<Skeleton className="min-h-[85vh] w-full rounded-none" />}
      >
        <HeroWithRating />
      </Suspense>

      <PopularServices />

      <Suspense
        fallback={
          <div className="bg-[#fafafa] py-20 px-4">
            <Skeleton className="h-64 w-full max-w-[1600px] mx-auto" />
          </div>
        }
      >
        <RecentReviews />
      </Suspense>

      <Suspense
        fallback={
          <div className="bg-white py-20 px-4">
            <Skeleton className="h-48 w-full max-w-lg mx-auto" />
          </div>
        }
      >
        <RatingBreakdown />
      </Suspense>

      <WhyChooseUs />
      <HowItWorks />
      <FAQSection />

      <CTASectionAnimated />
    </>
  )
}
