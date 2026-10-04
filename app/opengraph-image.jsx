import { ImageResponse } from 'next/og'

// Social share card used for every page (Facebook, LinkedIn, WhatsApp, X…)
export const alt = 'Moving Easy - Compare quotes from trusted NZ movers'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
          MOVING EASY
          <span style={{ color: '#2dd4bf', marginLeft: 12 }}>›</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>
            Move smarter,
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: '#5eead4' }}>
            move easier.
          </div>
          <div style={{ fontSize: 30, marginTop: 28, color: '#cbd5e1' }}>
            Compare quotes from trusted movers across New Zealand
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#94a3b8' }}>movingeasy.co.nz</div>
      </div>
    ),
    size,
  )
}
