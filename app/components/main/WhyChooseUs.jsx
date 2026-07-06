import WhyChooseUsAnimated from './WhyChooseUsAnimated'

const FEATURES = [
  {
    emoji: '🤲',
    title: 'Moving handled with care',
    desc: 'Professional carriers who treat your belongings like their own.',
  },
  {
    emoji: '🛠️',
    title: 'Fully equipped',
    desc: 'Our carriers bring all the tools, blankets, straps, and equipment needed.',
  },
  {
    emoji: '📅',
    title: '7 days / week',
    desc: 'Book any day — weekends, holidays, early mornings, or late evenings.',
  },
  {
    emoji: '⚙️',
    title: 'Customisable service',
    desc: 'From a single item to a full household move — you set the scope.',
  },
  {
    emoji: '📦',
    title: 'Single item delivery',
    desc: "Need just one sofa or washing machine moved? We've got you.",
  },
  {
    emoji: '⭐',
    title: '100% customer satisfaction',
    desc: 'Thousands of happy customers. Read our reviews to see why.',
  },
  {
    emoji: '💻',
    title: 'Book easily online',
    desc: 'Submit a request in under 2 minutes. No phone calls needed.',
  },
  {
    emoji: '🗺️',
    title: 'Anywhere in India',
    desc: 'Pan-India coverage — from metro cities to small towns.',
  },
  {
    emoji: '💯',
    title: 'No hidden fees',
    desc: 'Get upfront fixed quotes. What you see is what you pay — no surprises.',
  },
]

export default function WhyChooseUs() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-16 text-center">
          Why choose Moving Easy
        </h2>
        <WhyChooseUsAnimated features={FEATURES} />
      </div>
    </section>
  )
}
