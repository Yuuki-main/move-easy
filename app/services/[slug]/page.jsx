import Link from 'next/link'
import { notFound } from 'next/navigation'

const SERVICES = {
  'home-move': {
    type: 'home_move',
    title: 'Home Movers',
    desc: 'Get quotes from trusted movers for your home relocation — big or small.',
  },
  'office-move': {
    type: 'office_move',
    title: 'Office Removals',
    desc: 'Minimize downtime with professional office movers.',
  },
  'furniture-removal': {
    type: 'furniture',
    title: 'Furniture Delivery',
    desc: 'Move single items like sofas, beds, or wardrobes affordably.',
  },
  'car-transport': {
    type: 'car',
    title: 'Car Transport',
    desc: 'Ship your vehicle safely across the country.',
  },
  storage: {
    type: 'storage_move',
    title: 'Storage Solutions',
    desc: 'Find movers who can transport items to and from storage.',
  },
  'junk-removal': {
    type: 'junk',
    title: 'Junk Removal',
    desc: 'Clear out unwanted items quickly and responsibly.',
  },
}

export default async function ServicePage({ params }) {
  const { slug } = await params
  const service = SERVICES[slug]
  if (!service) notFound()

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
      <p className="text-gray-500 mb-8">{service.desc}</p>
      <Link
        href={`/get-prices?type=${service.type}`}
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-colors"
      >
        Get free quotes
      </Link>
    </div>
  )
}

export function generateStaticParams() {
  return Object.keys(SERVICES).map((slug) => ({ slug }))
}
