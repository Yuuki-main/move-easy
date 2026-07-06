export const metadata = {
  title: 'Reviews | Moving Easy',
  description: 'Read verified reviews from thousands of Moving Easy customers across New Zealand.',
}

const REVIEWS = [
  {
    id: 1,
    score: 10,
    name: 'Aroha',
    ago: '2 hours ago',
    text: 'Phil was great, could not fault anything. Great price and great communication, would definitely use 5 star freighting again.',
    price: 'NZ$275',
    jobType: 'Boxes',
    from: 'Pukekohe',
    destination: 'Mount Maunganui',
  },
  {
    id: 2,
    score: 10,
    name: 'Jen',
    ago: '4 hours ago',
    text: 'Ash was amazing, he made it so easy and removed all the stress of transporting my couch from iFurniture directly to my home. He picked up the couch on my behalf on time and kept me updated on ETA. He was right on time at my residence. Thank you Ash — you made my day with your professionalism and genuine service. Always recommended!!!',
    price: 'NZ$105',
    jobType: 'Sofa',
    from: 'Penrose, Auckland',
    destination: 'Ōtāhuhu, Auckland',
  },
  {
    id: 3,
    score: 9,
    name: 'Marcus',
    ago: '1 day ago',
    text: 'Really happy with how the move went. The team were efficient and careful with my furniture. Nothing was damaged and they finished ahead of schedule. Will use Moving Easy again for sure.',
    price: 'NZ$420',
    jobType: 'Home move',
    from: 'Newmarket, Auckland',
    destination: 'Takapuna, Auckland',
  },
  {
    id: 4,
    score: 10,
    name: 'Priya',
    ago: '2 days ago',
    text: 'Incredibly smooth experience. Got four quotes within two hours of posting my job, and the carrier I chose was professional and on time. Moving Easy is now my go-to for any deliveries.',
    price: 'NZ$185',
    jobType: 'Office furniture',
    from: 'Wellington CBD',
    destination: 'Lower Hutt',
  },
  {
    id: 5,
    score: 9,
    name: 'Liam',
    ago: '3 days ago',
    text: "Used Moving Easy for a big house move from Christchurch to Dunedin. The whole process was transparent and I knew exactly what I was paying upfront. Carrier was friendly and nothing was broken. Highly recommend.",
    price: 'NZ$890',
    jobType: 'Home move',
    from: 'Christchurch',
    destination: 'Dunedin',
  },
  {
    id: 6,
    score: 10,
    name: 'Sophie',
    ago: '5 days ago',
    text: "What a relief compared to dealing with traditional moving companies. Posted my job, got competitive quotes, picked the best one and it was sorted. The carrier even helped me reassemble my bed frame at no extra cost. Five stars!",
    price: 'NZ$310',
    jobType: 'Home move',
    from: 'Hamilton',
    destination: 'Tauranga',
  },
]

const RATING_BARS = [
  { label: 'Excellent', count: '51,503', pct: 88 },
  { label: 'Great', count: '4,087', pct: 12 },
  { label: 'Average', count: '530', pct: 3 },
  { label: 'Poor', count: '416', pct: 2 },
]

function Stars({ filled = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < filled ? 'text-zinc-900' : 'text-zinc-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <main className="pb-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* Hero */}
        <div className="flex items-start justify-between pt-10 pb-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              56,536 Verified Reviews
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-zinc-900 leading-tight mb-4">
              Our reviews
            </h1>
            <p className="text-zinc-500 text-base leading-relaxed max-w-xs">
              We&apos;ve set a new standard for thorough and thoughtful service.
            </p>
          </div>
          {/* Decorative image placeholder */}
          <div className="hidden sm:flex items-end justify-center w-52 h-36 text-6xl select-none">
            🛋️📦
          </div>
        </div>

        {/* Rating summary card */}
        <div className="rounded-2xl border border-zinc-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Score */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-zinc-900 text-white text-3xl font-extrabold">
                9.7
              </div>
              <div>
                <p className="text-xl font-bold text-zinc-900">Exceptional</p>
                <Stars filled={5} />
                <p className="text-xs text-zinc-400 mt-1">
                  Based on{' '}
                  <span className="underline cursor-pointer">56,536 reviews</span>
                </p>
              </div>
            </div>

            {/* Breakdown bars */}
            <div className="flex-1 w-full space-y-2">
              {RATING_BARS.map(({ label, count, pct }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <span className="w-16 text-zinc-500 shrink-0">{label}</span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-zinc-900 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-zinc-500 shrink-0">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quote block */}
        <div className="flex gap-5 items-start mb-10">
          <div className="flex-shrink-0 w-11 h-11 rounded-full bg-zinc-900 flex items-center justify-center text-white text-lg font-bold">
            ❝
          </div>
          <p className="text-zinc-600 leading-relaxed text-sm">
            Don&apos;t just take our word for it — read through the reviews of Moving Easy to learn
            stories from our customers and get a deeper understanding of the level of service we
            provide and the experiences of those who have used our services before.
          </p>
        </div>

        {/* Review cards */}
        <div className="space-y-5">
          {REVIEWS.map((r) => (
            <div key={r.id} className="rounded-2xl border border-zinc-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-900 text-white text-lg font-extrabold shrink-0">
                    {r.score}
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">{r.name}</p>
                    <p className="text-xs text-zinc-400">Reviewed {r.ago}</p>
                  </div>
                </div>
                <Stars filled={5} />
              </div>

              {/* Review text */}
              <div className="flex gap-3 mb-6">
                <span className="text-4xl text-zinc-200 font-serif leading-none mt-1 select-none">
                  ❝
                </span>
                <p className="text-zinc-600 text-sm leading-relaxed">{r.text}</p>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{r.price}</p>
                    <p className="text-xs text-zinc-400">Total price</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{r.jobType}</p>
                    <p className="text-xs text-zinc-400">{r.from}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{r.destination}</p>
                    <p className="text-xs text-zinc-400">Destination</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-10 rounded-2xl border border-zinc-200 p-6 flex items-center gap-5">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xl">
            ♥
          </div>
          <div className="flex-1">
            <p className="font-bold text-zinc-900">Thousands of happy customers</p>
            <p className="text-sm text-zinc-500">
              Join thousands of Kiwis who trust Moving Easy for their moving and delivery needs.
            </p>
          </div>
          <a
            href="/get-prices"
            className="shrink-0 px-5 py-2.5 text-sm font-semibold rounded-xl bg-zinc-900 text-white hover:bg-black transition-colors whitespace-nowrap"
          >
            Get a quote
          </a>
        </div>

      </div>
    </main>
  )
}
