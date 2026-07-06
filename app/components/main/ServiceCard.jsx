export default function ServiceCard({ service }) {
  const Icon = service.icon

  return (
    <button
      type="button"
      aria-label={service.label}
      className="
        group
        shrink-0
        w-[280px]
        rounded-[28px]
        bg-white
        border border-black/[0.06]
        p-6
        text-left
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)]
        focus:outline-none
        focus:ring-2
        focus:ring-black/10
      "
    >
      <div className="flex justify-center items-center h-[90px]">
        <Icon />
      </div>

      <div className="mt-5">
        <h3 className="text-[18px] font-bold tracking-[-0.02em] text-[#111]">
          {service.label}
        </h3>

        <p className="mt-2 text-[14px] leading-[22px] text-[#666]">
          {service.sub}
        </p>
      </div>
    </button>
  )
}
