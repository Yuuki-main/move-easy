import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { loadJobCompetition } from '@/lib/carrier-quotes'
import { isQuoteExpired, distanceKm } from '@/lib/quotes'
import QuoteBoard from './QuoteBoard'

function bucketFor(quote) {
  if (quote.status === 'accepted') return 'booked'
  if (quote.status === 'withdrawn') return 'withdrawn'
  // Booking cancelled after acceptance
  if (quote.status === 'cancelled') return 'lost'
  if (quote.status === 'rejected' || quote.jobs?.status === 'booked') return 'lost'
  if (['cancelled', 'canceled'].includes(quote.jobs?.status)) return 'lost'
  if (isQuoteExpired(quote)) return 'expired'
  return 'active'
}

export default async function CarrierQuotesPage() {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user

  const { data: quotes } = await supabase
    .from('quotes')
    .select(
      `
      *,
      jobs (
        id,
        type,
        pickup_address,
        pickup_lat,
        pickup_lng,
        delivery_address,
        delivery_lat,
        delivery_lng,
        move_date_from,
        move_date_to,
        status,
        created_at
      )
    `,
    )
    .eq('carrier_id', user.id)
    .order('created_at', { ascending: false })

  const competition = await loadJobCompetition(
    (quotes ?? []).map((q) => q.job_id),
    user.id,
  )

  const rows = (quotes ?? []).map((q) => {
    const comp = competition[q.job_id] ?? { bids: [], mine: {}, others: 0 }
    const others = comp.bids.filter((b) => !b.isMine).map((b) => b.price)
    return {
      id: q.id,
      jobId: q.job_id,
      bucket: bucketFor(q),
      price: Number(q.price),
      previousPrice: q.previous_price != null ? Number(q.previous_price) : null,
      quotedAt: q.created_at,
      updatedAt: q.updated_at,
      expiresAt: q.expires_at,
      notes: q.carrier_notes ?? '',
      job: {
        type: q.jobs?.type,
        pickup: q.jobs?.pickup_address,
        delivery: q.jobs?.delivery_address,
        moveFrom: q.jobs?.move_date_from,
        moveTo: q.jobs?.move_date_to,
        createdAt: q.jobs?.created_at,
        distance: distanceKm(q.jobs),
      },
      bidCount: comp.bids.length,
      lowest: comp.bids.length ? Math.min(...comp.bids.map((b) => b.price)) : null,
      competitorPrices: others,
      messages: { mine: comp.mine.count ?? 0, last: comp.mine.last ?? null, others: comp.others },
    }
  })

  return <QuoteBoard rows={rows} />
}
