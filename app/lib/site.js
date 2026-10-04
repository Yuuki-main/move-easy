// The one canonical public address of the site. Set NEXT_PUBLIC_APP_URL per
// environment; production is https://www.movingeasy.co.nz.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.movingeasy.co.nz'
).replace(/\/$/, '')

export const SITE_NAME = 'Moving Easy'
export const SITE_TAGLINE = 'Move Smarter, Move Easier'
export const SITE_DESCRIPTION =
  'Find trusted movers across New Zealand, compare quotes, and book your move with ease.'
