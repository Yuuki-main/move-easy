'use client'

const JOB_TYPES = [
  {
    section: 'Move',
    items: [
      { value: 'home_move', label: 'Home Move', icon: '🏠', desc: 'House or apartment' },
      { value: 'office_move', label: 'Office Move', icon: '🏢', desc: 'Commercial space' },
      { value: 'storage_move', label: 'Storage', icon: '🏪', desc: 'Storage unit move' },
    ],
  },
  {
    section: 'Items',
    items: [
      { value: 'furniture', label: 'Furniture', icon: '🛋️', desc: 'Sofa, table, bed...' },
      { value: 'item', label: 'Parcel / Item', icon: '📦', desc: 'Electronics, boxes...' },
    ],
  },
  {
    section: 'Vehicle',
    items: [
      { value: 'car', label: 'Car', icon: '🚗', desc: 'Sedan, 4x4, pickup...' },
      { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️', desc: 'Bike, moped, scooter' },
      { value: 'other_vehicle', label: 'Other Vehicle', icon: '🚛', desc: 'Truck, bus, RV...' },
    ],
  },
  {
    section: 'Specialty',
    items: [
      { value: 'boat', label: 'Boat', icon: '⛵', desc: 'Powerboat, sailboat...' },
      { value: 'piano', label: 'Piano', icon: '🎹', desc: 'Grand, upright, digital' },
      { value: 'pet', label: 'Pet Transport', icon: '🐾', desc: 'Cat, dog, bird...' },
      { value: 'junk', label: 'Junk Removal', icon: '🗑️', desc: 'Rubbish clearance' },
      { value: 'other', label: 'Other', icon: '📋', desc: 'Heavy / farm equipment' },
    ],
  },
]

export default function Step1JobType({ wizard }) {
  const select = (value) => {
    wizard.update({ jobType: value })
    wizard.nextStep()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">What are you moving?</h1>
      <p className="text-gray-500 mb-8 text-sm">Select the type that best describes your job.</p>

      <div className="space-y-7">
        {JOB_TYPES.map((section) => (
          <div key={section.section}>
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.section}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {section.items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => select(item.value)}
                  className="flex flex-col items-start gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left transition-all hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm active:scale-[0.98]"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-semibold text-gray-800 leading-tight">
                    {item.label}
                  </span>
                  <span className="text-xs text-gray-400 leading-tight">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
