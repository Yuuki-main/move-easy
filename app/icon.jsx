import { ImageResponse } from 'next/og'

// Browser-tab favicon: the chevron from the Moving Easy logo
export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(<BrandMark radius={14} />, size)
}

export function BrandMark({ radius }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#111111',
        borderRadius: radius,
      }}
    >
      <svg width="62%" height="62%" viewBox="0 0 100 100">
        {/* Same chevron as the logo's arrow */}
        <polygon points="18,8 52,8 92,50 52,92 18,92 58,50" fill="#ffffff" />
      </svg>
    </div>
  )
}
