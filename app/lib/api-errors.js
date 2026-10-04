import { NextResponse } from 'next/server'

// Log the real error on the server; give the browser a generic message.
// Database/driver messages can leak table names, constraints and data.
export function serverError(tag, err, message = 'Something went wrong. Please try again.') {
  console.error(`[${tag}]`, err?.message ?? err)
  return NextResponse.json({ error: message }, { status: 500 })
}
