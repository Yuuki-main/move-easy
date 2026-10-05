import { SITE_URL } from '@/lib/site'
import { supabaseAdmin } from '@/lib/supabase/admin'

const STATIC_PAGES = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/get-prices', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/reviews', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/for-movers', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' },
]

// Keep in sync with SERVICES in app/services/[slug]/page.jsx
const SERVICE_SLUGS = [
  'home-move',
  'office-move',
  'furniture-removal',
  'car-transport',
  'storage',
  'junk-removal',
]

// Rebuild the sitemap at most once a day
export const revalidate = 86400

export default async function sitemap() {
  const now = new Date()

  const pages = STATIC_PAGES.map((p) => ({
    url: `${SITE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }))

  const services = SERVICE_SLUGS.map((slug) => ({
    url: `${SITE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  // Public profiles of approved carriers
  let carriers = []
  try {
    const { data } = await supabaseAdmin
      .from('carrier_profiles')
      .select('id, updated_at')
      .eq('application_status', 'active')
    carriers = (data ?? []).map((c) => ({
      url: `${SITE_URL}/carrier/${c.id}`,
      lastModified: c.updated_at ? new Date(c.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  } catch (err) {
    console.error('[sitemap] carrier list failed:', err.message)
  }

  return [...pages, ...services, ...carriers]
}
