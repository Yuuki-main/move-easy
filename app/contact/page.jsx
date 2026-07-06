export const metadata = {
  title: 'Contact Us | Moving Easy',
  description: 'Get in touch with the Moving Easy team.',
}

const REVIEWS = [
  {
    score: 10,
    name: 'Sarah M.',
    location: 'Auckland → Wellington',
    text: 'Absolutely seamless from start to finish. Got three quotes within an hour and my carrier was friendly and careful with everything.',
    jobType: 'Home move',
    price: 'NZ$480',
  },
  {
    score: 9,
    name: 'James K.',
    location: 'Christchurch → Dunedin',
    text: 'Great platform — super easy to post a job and the competitive quoting saved me a lot of money. Would 100% use again.',
    jobType: 'Furniture',
    price: 'NZ$220',
  },
  {
    score: 10,
    name: 'Priya T.',
    location: 'Hamilton → Tauranga',
    text: 'The carrier was on time, polite, and packed everything carefully. Moving Easy made the whole process so much less stressful.',
    jobType: 'Home move',
    price: 'NZ$310',
  },
]

export default function ContactPage() {
  return (
    <main className="pb-20">
      {/* Hero card */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="rounded-2xl bg-zinc-900 text-white px-8 sm:px-12 py-14 flex flex-col sm:flex-row items-center gap-10">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold tracking-widest text-zinc-400 uppercase mb-3">
              Get in touch
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4">
              Contact Moving Easy
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Have a question, a problem with a booking, or just want to say hi?
              We&apos;re here to help — usually within a few hours.
            </p>
          </div>
          <div className="flex-shrink-0 text-8xl select-none">📦</div>
        </div>
      </section>

      {/* Contact options */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Email */}
          <div className="rounded-2xl border border-zinc-200 p-8 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
              ✉️
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg mb-1">Email us</h2>
              <p className="text-zinc-500 text-sm mb-3">
                For general enquiries, booking issues, or feedback.
              </p>
              <a
                href="mailto:support@movingez.co.nz"
                className="text-blue-600 font-semibold hover:underline text-sm"
              >
                support@movingez.co.nz
              </a>
            </div>
          </div>

          {/* Carrier sign-up */}
          <div className="rounded-2xl border border-zinc-200 p-8 flex flex-col gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center text-xl">
              🚛
            </div>
            <div>
              <h2 className="font-bold text-zinc-900 text-lg mb-1">Become a carrier</h2>
              <p className="text-zinc-500 text-sm mb-3">
                Want to earn money doing what you do? Join our carrier network.
              </p>
              <a
                href="/carrier-register"
                className="text-green-700 font-semibold hover:underline text-sm"
              >
                Apply to join →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="text-center mb-10">
          <span className="inline-block text-sm font-semibold text-blue-600 tracking-widest uppercase mb-3">
            Reviews
          </span>
          <h2 className="text-3xl font-extrabold text-zinc-900">
            What do our customers say?
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {REVIEWS.map((r) => (
            <div key={r.name} className="rounded-2xl border border-zinc-100 bg-white p-6 flex flex-col gap-4 shadow-sm">
              {/* Score */}
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-zinc-900 text-white text-sm font-bold">
                  {r.score}
                </span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(r.score / 2) ? 'text-amber-400' : 'text-zinc-200'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="text-zinc-600 text-sm leading-relaxed flex-1">&ldquo;{r.text}&rdquo;</p>

              {/* Meta */}
              <div className="pt-3 border-t border-zinc-100 space-y-1">
                <p className="text-xs font-semibold text-zinc-800">{r.name}</p>
                <p className="text-xs text-zinc-400">{r.jobType} · {r.price}</p>
                <p className="text-xs text-zinc-400">{r.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
