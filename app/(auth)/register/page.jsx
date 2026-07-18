'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema } from '../../lib/validations/auth'
import { createClient } from '../../lib/supabase/client'

const TIMEZONES = [
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
  const supabase = createClient()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: '',
      email: '',
      phone: '',
      timezone: '(GMT+12:00) Auckland, Wellington',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data) {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'customer',
          first_name: data.first_name,
        },
      },
    })

    if (signUpError) {
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setError('email', { message: 'This email is already registered' })
      } else {
        setError('root', { message: signUpError.message })
      }
      setFocus('email')
      return
    }

    if (authData?.user) {
      await supabase
        .from('profiles')
        .update({
          phone: data.phone,
          timezone: data.timezone,
        })
        .eq('id', authData.user.id)
    }

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

        {errors.root && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
            {errors.root.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* First name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First name
            </label>
            <input
              {...register('first_name')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Rajat"
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="you@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">
              We would not share your email with other users.
            </p>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mobile number
            </label>
            <input
              type="tel"
              {...register('phone')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="+64 21 234 5678"
            />
            <p className="text-xs text-gray-400 mt-1">
              Only shared with your confirmed carrier.
            </p>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
            )}
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <select
              {...register('timezone')}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                errors.timezone ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            {errors.timezone && (
              <p className="text-red-500 text-xs mt-1">{errors.timezone.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-xs text-center text-gray-400">
            By registering, you agree to our Terms of Use and Privacy Policy.
          </p>
        </form>

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
