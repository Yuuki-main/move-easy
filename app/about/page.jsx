export const metadata = {
  title: 'About Us | Moving Easy',
  description: 'Learn about Moving Easy — putting trust back into moving across New Zealand.',
}

export default function AboutPage() {
  return (
    <main className="pb-20">
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center mb-12">
          <span className="inline-block text-sm font-semibold text-blue-600 tracking-widest uppercase mb-4">
            Who we are
          </span>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-zinc-900 leading-tight">
            About us
          </h1>
        </div>

        {/* Hero image placeholder */}
        <div className="w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-zinc-100 flex items-center justify-center mb-16">
          <div className="text-center text-zinc-400">
            <div className="text-6xl mb-3">🚚</div>
            <p className="text-sm">Moving Easy — New Zealand</p>
          </div>
        </div>

        {/* Intro paragraph */}
        <div className="max-w-3xl mx-auto text-lg text-zinc-600 leading-relaxed space-y-5 mb-16">
          <p>
            Moving Easy is New Zealand&apos;s trusted moving marketplace, connecting everyday Kiwis with
            professional movers across the country. We believe moving should be straightforward,
            transparent, and stress-free — so we built a platform that makes it exactly that.
          </p>
          <p>
            Our network of verified carriers competes to give you the best price for your job,
            whether you&apos;re shifting a sofa across town or a full household from Auckland to Queenstown.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-16 max-w-3xl mx-auto">
          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-2xl shrink-0">
              🤝
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">
                Putting trust back into moving
              </h2>
              <p className="text-zinc-600 leading-relaxed">
                The moving industry has long been plagued by hidden fees, no-shows, and damaged goods
                with no recourse. Moving Easy was built to change that. Every carrier on our platform
                is vetted, reviewed, and held accountable. Customers can see real reviews from real
                people, and carriers earn their reputation one job at a time.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-green-50 text-2xl shrink-0">
              🌿
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">
                A new standard of moving in New Zealand
              </h2>
              <p className="text-zinc-600 leading-relaxed">
                We introduced competitive quoting to New Zealand — so instead of calling five
                companies yourself, you post your job once and carriers come to you. You compare
                prices, read reviews, and book in minutes. It&apos;s how moving should work.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-50 text-2xl shrink-0">
              📍
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">
                Local teams in every town and city
              </h2>
              <p className="text-zinc-600 leading-relaxed">
                From Auckland to Invercargill, our carriers are local experts who know the roads,
                the buildings, and the communities they serve. When you book through Moving Easy
                you&apos;re supporting local businesses — not a faceless national chain.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-20 text-center">
          <p className="text-zinc-500 mb-6 text-lg">Ready to experience a better move?</p>
          <a
            href="/get-prices"
            className="inline-block px-8 py-3.5 text-sm font-semibold rounded-xl bg-zinc-900 text-white hover:bg-black transition-colors"
          >
            Get free quotes
          </a>
        </div>
      </section>
    </main>
  )
}
