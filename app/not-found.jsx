import Link from 'next/link'

export const metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-teal-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-sm text-gray-500">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-6 flex gap-2">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          Go home
        </Link>
        <Link
          href="/get-prices"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Get moving quotes
        </Link>
      </div>
    </div>
  )
}
