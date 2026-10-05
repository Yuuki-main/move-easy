import HowItWorksAnimated from './HowItWorksAnimated'

const STEPS = [
  {
    num: '01',
    image: '/home/create_your_request.jpg',
    // Portrait photo: keep the face in the wide frame
    imagePosition: 'center 12%',
    title: 'Create your request',
    desc: "Tell us what you're moving, where from and to, and when. Add photos and details so carriers can give accurate quotes.",
  },
  {
    num: '02',
    image: '/home/get_quotes_from_carriers.png',
    title: 'Get quotes from carriers',
    desc: 'Verified carriers across New Zealand review your request and send competitive quotes. Compare prices, ratings, and reviews.',
  },
  {
    num: '03',
    image: '/home/book_with_confidence.png',
    title: 'Book with confidence',
    desc: 'Choose the best quote and confirm your booking. Your carrier handles the rest — pickup, transport, and delivery.',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-16">
          How it works
        </h2>
        <HowItWorksAnimated steps={STEPS} />
      </div>
    </section>
  )
}
