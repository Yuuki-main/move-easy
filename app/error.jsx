'use client' // Error boundaries must be Client Components

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, unstable_retry }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <p className="text-sm font-semibold text-teal-600">Something went wrong</p>
      <h1 className="mt-2 text-2xl font-bold text-gray-900">This page hit a problem</h1>
      <p className="mt-2 text-sm text-gray-500">
        Please try again. If it keeps happening, contact us at support@movingeasy.co.nz
        {error?.digest && (
          <>
            {' '}and quote reference <span className="font-mono">{error.digest}</span>
          </>
        )}
        .
      </p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
