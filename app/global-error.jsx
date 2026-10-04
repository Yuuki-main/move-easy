'use client' // Replaces the root layout when it fails, so it brings its own <html>

import './globals.css'

export default function GlobalError({ error, unstable_retry }) {
  return (
    <html lang="en-NZ">
      <body className="flex min-h-screen items-center justify-center bg-white px-4 font-sans">
        <title>Something went wrong | Moving Easy</title>
        <div className="max-w-md text-center">
          <p className="text-sm font-bold tracking-wide text-gray-900">MOVING EASY</p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            Please try again. If it keeps happening, contact support@movingeasy.co.nz
            {error?.digest && (
              <>
                {' '}and quote reference <span className="font-mono">{error.digest}</span>
              </>
            )}
            .
          </p>
          <button
            onClick={() => unstable_retry()}
            className="mt-6 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
