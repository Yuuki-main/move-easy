import HowItWorksAnimated from './HowItWorksAnimated'

const STEPS = [
  {
    num: '01',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=450&fit=crop&crop=center',
    title: 'Create your request',
    desc: "Tell us what you're moving, where from and to, and when. Add photos and details so carriers can give accurate quotes.",
  },
  {
    num: '02',
    image:
      'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&h=450&fit=crop&crop=center',
    title: 'Get quotes from carriers',
    desc: 'Verified carriers across India review your request and send competitive quotes. Compare prices, ratings, and reviews.',
  },
  {
    num: '03',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop&crop=center',
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
