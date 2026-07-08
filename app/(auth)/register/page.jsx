'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '../../lib/supabase/client'

const TIMEZONES = [
  '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi',
  '(GMT+12:00) Auckland, Wellington',
  '(GMT+00:00) London',
  '(GMT-05:00) Eastern Time (US & Canada)',
  '(GMT-08:00) Pacific Time (US & Canada)',
  '(GMT+01:00) Berlin, Paris, Rome',
  '(GMT+08:00) Beijing, Singapore, Hong Kong',
  '(GMT+09:00) Tokyo, Seoul',
  '(GMT+10:00) Sydney, Melbourne',
]

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    timezone: '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: 'customer',
          first_name: form.first_name,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data?.user) {
      await supabase
        .from('profiles')
        .update({
          phone: form.phone,
          timezone: form.timezone,
        })
        .eq('id', data.user.id)
    }

    setLoading(false)
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Create your account
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Book and manage moving services
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              name="first_name"
              value={form.first_name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Rajat"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              We would not share your email with other users.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number
            </label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+91 98765 43210"
            />
            <p className="text-xs text-gray-400 mt-1">
              Only shared with your confirmed carrier.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By registering, you agree to our Terms of Use and Privacy Policy.
          </p>
        </div>

        <div className="mt-6 text-sm text-center text-gray-500 space-y-2">
          <p>
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
          <p>
            Transport company?{' '}
            <Link
              href="/carrier-register"
              className="text-blue-600 hover:underline font-medium"
            >
              Register as carrier
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
