import PopularServicesAnimated from './PopularServicesAnimated'

const SERVICES = [
  {
    type: 'home_move',
    emoji: '🏠',
    label: 'Home Move',
    sub: 'House or apartment relocation',
  },
  {
    type: 'office_move',
    emoji: '🏢',
    label: 'Office Move',
    sub: 'Commercial space moving',
  },
  {
    type: 'furniture',
    emoji: '🛋️',
    label: 'Furniture',
    sub: 'Sofa, table, bed, wardrobe',
  },
  {
    type: 'car',
    emoji: '🚗',
    label: 'Car Transport',
    sub: 'Any car type, any distance',
  },
  {
    type: 'motorcycle',
    emoji: '🏍️',
    label: 'Motorcycle',
    sub: 'Bike, moped, scooter',
  },
  {
    type: 'item',
    emoji: '📦',
    label: 'Parcel / Item',
    sub: 'Electronics, boxes, antiques',
  },
  {
    type: 'boat',
    emoji: '⛵',
    label: 'Boat Transport',
    sub: 'Powerboat, sailboat, jet ski',
  },
  {
    type: 'piano',
    emoji: '🎹',
    label: 'Piano Move',
    sub: 'Grand, upright, digital piano',
  },
  {
    type: 'pet',
    emoji: '🐾',
    label: 'Pet Transport',
    sub: 'Cat, dog, bird, horse',
  },
  {
    type: 'junk',
    emoji: '🗑️',
    label: 'Junk Removal',
    sub: 'Rubbish clearance, disposal',
  },
  {
    type: 'storage_move',
    emoji: '🏪',
    label: 'Storage',
    sub: 'Storage unit moves',
  },
  {
    type: 'other',
    emoji: '📋',
    label: 'Other',
    sub: 'Heavy equipment, machinery',
  },
]

export default function PopularServices() {
  return (
    <section className="bg-white py-20 overflow-hidden max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="max-w-400 mx-auto">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
          Compare quotes for any moving service
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          Get competitive prices from trusted carriers across India.
        </p>
        <PopularServicesAnimated services={SERVICES} />
      </div>
    </section>
  )
}
