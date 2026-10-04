import { ImageResponse } from 'next/og'
import { BrandMark } from './icon'

// iPhone / iPad home-screen icon (iOS rounds the corners itself)
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(<BrandMark radius={0} />, size)
}
