import Link from 'next/link'
import {
  ClipboardCheck,
  BellRing,
  Scale,
  Handshake,
  CheckCircle2,
  Wallet,
} from 'lucide-react'
import { PLATFORM_FEE_RATE } from '@/lib/quotes'

export const metadata = {
  title: 'How it works for movers',
  description:
    'Get moving jobs from customers across New Zealand. Sign up free, quote on the jobs you want, and only pay a fee when you win the work.',
}

const FEE = `${Math.round(PLATFORM_FEE_RATE * 100)}%`

const STEPS = [
  {
    icon: ClipboardCheck,
    title: 'Sign up and complete your profile',
    body: 'Create a free mover account, then add a business description, phone number, a photo of your truck or team, your ID and your insurance. Our team reviews and approves new movers, usually within 24 hours.',
  },
  {
    icon: BellRing,
    title: 'Get new jobs by email',
    body: 'Every time a customer posts a move, we email you the details: pickup and delivery area, dates and items. You can also browse all open jobs any time.',
  },
  {
    icon: Scale,
    title: 'Quote — and see how you compare',
    body: "Send your price and a note. You'll see the other quotes on the job, whether you're leading or behind, and can match the lowest price in one click. You can change or withdraw your quote until the customer decides.",
  },
  {
    icon: Handshake,
    title: 'Win the job',
    body: "When the customer accepts your quote, you're booked. Their contact details are revealed and you can chat to arrange the move.",
  },
  {
    icon: CheckCircle2,
    title: 'Do the move and get reviewed',
    body: 'Mark the job complete when it’s done. The customer is asked to review you, and good reviews help you win more work.',
  },
]

export default function ForMoversPage() {
  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-14">
        <p className="text-sm font-semibold text-teal-600">For movers</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Get more moving jobs across New Zealand
        </h1>
        <p className="mt-3 max-w-2xl text-gray-600">
          Customers post their move, movers quote, and the customer picks.
          It&apos;s free to join and free to quote — you only pay when you win a
          job.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/carrier-register"
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-black"
          >
            Become a mover
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Mover login
          </Link>
        </div>

        <ol className="mt-12 space-y-4">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {i + 1}. {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-10 rounded-2xl bg-zinc-900 p-6 text-white">
          <div className="flex items-start gap-4">
            <Wallet className="mt-0.5 h-6 w-6 shrink-0 text-teal-300" />
            <div>
              <h2 className="text-lg font-semibold">What it costs</h2>
              <p className="mt-1 text-sm leading-relaxed text-zinc-300">
                Joining and quoting are free. When a customer accepts your
                quote, a {FEE} platform fee is taken from your Moving Easy
                wallet. You keep the rest, paid directly by the customer. Top up
                your wallet by card in your dashboard; you need at least $1 in
                it to send quotes.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-sm text-gray-500">
          Questions? Email{' '}
          <a
            href="mailto:info@movingeasy.co.nz"
            className="font-medium text-teal-700 hover:underline"
          >
            info@movingeasy.co.nz
          </a>
          .
        </p>
      </div>
    </div>
  )
}
