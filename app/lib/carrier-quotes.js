import { supabaseAdmin } from '@/lib/supabase/admin'
import { isQuoteExpired } from '@/lib/quotes'

// Everything the carrier needs to see how their bid stacks up on a set of
// jobs. Competitor quotes and message counts sit behind RLS for the carrier,
// so this runs with the service role and only returns aggregate/public data
// (competitor names, ratings, prices) — never competitor notes or contacts.
export async function loadJobCompetition(jobIds, carrierId) {
  if (!jobIds.length) return {}

  const [{ data: quotes, error: quotesError }, { data: conversations }] = await Promise.all([
    supabaseAdmin
      .from('quotes')
      .select(
        // '*' rather than named columns so this works before and after migration 005
        '*, carrier_profiles(public_name, average_rating, slug)',
      )
      .in('job_id', jobIds)
      .in('status', ['pending', 'accepted']),
    supabaseAdmin
      .from('conversations')
      .select('id, job_id, carrier_id')
      .in('job_id', jobIds),
  ])

  if (quotesError) console.error('[loadJobCompetition] quotes query failed:', quotesError.message)

  const convIds = (conversations ?? []).map((c) => c.id)
  const { data: messages } = convIds.length
    ? await supabaseAdmin
        .from('chat_messages')
        .select('conversation_id, sender_id, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const convById = Object.fromEntries((conversations ?? []).map((c) => [c.id, c]))
  const byJob = Object.fromEntries(
    jobIds.map((id) => [
      id,
      { bids: [], mine: { count: 0, last: null }, others: 0, perCarrier: {} },
    ]),
  )

  for (const q of quotes ?? []) {
    if (q.status === 'pending' && isQuoteExpired(q)) continue
    byJob[q.job_id]?.bids.push({
      id: q.id,
      carrierId: q.carrier_id,
      name: q.carrier_profiles?.public_name ?? 'Carrier',
      rating: q.carrier_profiles?.average_rating ?? null,
      price: Number(q.price),
      isMine: q.carrier_id === carrierId,
    })
  }

  for (const m of messages ?? []) {
    const conv = convById[m.conversation_id]
    const job = conv && byJob[conv.job_id]
    if (!job) continue
    job.perCarrier[conv.carrier_id] = (job.perCarrier[conv.carrier_id] ?? 0) + 1
    if (conv.carrier_id === carrierId) {
      job.mine.count += 1
      // Messages are newest-first, so the first one we see is the latest.
      job.mine.last ??= {
        fromMe: m.sender_id === carrierId,
        at: m.created_at,
      }
    } else {
      job.others += 1
    }
  }

  for (const job of Object.values(byJob)) {
    job.bids.sort((a, b) => a.price - b.price || Number(b.isMine) - Number(a.isMine))
    job.bids = job.bids.map((b) => ({ ...b, messages: job.perCarrier[b.carrierId] ?? 0 }))
  }

  return byJob
}
