'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  carrierRegisterSchema,
  CARRIER_STEP_FIELDS,
} from '../../lib/validations/auth'
import { createClient } from '../../lib/supabase/client'

const STEPS = ['Identity', 'Address', 'Profile', 'Company', 'Categories', 'Finish']

const SERVICE_CATEGORIES = [
  { value: 'home_move', label: 'Home Move' },
  { value: 'office_move', label: 'Office Move' },
  { value: 'storage', label: 'Storage' },
  { value: 'car', label: 'Car Transport' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'boat', label: 'Boat' },
  { value: 'piano', label: 'Piano' },
  { value: 'pet', label: 'Pet Transport' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'junk', label: 'Junk Removal' },
  { value: 'other_vehicle', label: 'Other Vehicle' },
]

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Bank Transfer', 'PayPal', 'Cheque']
const PAYMENT_TIMEFRAMES = [
  'Before collection',
  'At collection',
  'At delivery',
  'After delivery',
]

const DEFAULT_VALUES = {
  first_name: '',
  last_name: '',
  date_of_birth: '',
  email: '',
  password: '',
  confirmPassword: '',
  address_type: 'personal',
  address_line1: '',
  address_line2: '',
  city: '',
  postcode: '',
  country: 'New Zealand',
  public_name: '',
  profile_description: '',
  payment_methods: [],
  payment_timeframes: [],
  legal_company_name: '',
  company_registration_number: '',
  gst_number: '',
  is_gst_registered: true,
  is_individual_carrier: false,
  service_categories: [],
}

export default function CarrierRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    control,
    formState: { errors, isSubmitting },
    setError,
    setFocus,
  } = useForm({
    resolver: zodResolver(carrierRegisterSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const watchIsGst = watch('is_gst_registered')
  const watchAddressType = watch('address_type')

  // ── Step navigation with per-step validation ──────────────────────

  async function nextStep() {
    const valid = await trigger(CARRIER_STEP_FIELDS[step])
    if (valid) setStep((s) => s + 1)
  }

  function prevStep() {
    setStep((s) => s - 1)
  }

  // ── Submit ─────────────────────────────────────────────────────────

  async function onSubmit(data) {
    // 1. Sign up with carrier role metadata
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          role: 'carrier',
          first_name: data.first_name,
        },
      },
    })

    if (signUpError) {
      setStep(0)
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setError('email', { message: 'This email is already registered' })
      } else {
        setError('root', { message: signUpError.message })
      }
      setFocus('email')
      return
    }

    if (!authData?.user) {
      setError('root', { message: 'Registration failed. Please try again.' })
      return
    }

    // 2. Wait for trigger to create profiles row, then check once
    await new Promise((r) => setTimeout(r, 1000))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      setError('root', {
        message: 'Account created but profile setup failed. Please try logging in.',
      })
      return
    }

    // 3. Update profiles with last_name and date_of_birth
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      setError('root', { message: updateError.message })
      return
    }

    // 4. Generate slug from public_name
    const slugBase = data.public_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const slug = `${slugBase}-${authData.user.id.slice(-4)}`

    // 5. Insert into carrier_profiles
    const { error: insertError } = await supabase
      .from('carrier_profiles')
      .insert({
        id: authData.user.id,
        public_name: data.public_name,
        profile_description: data.profile_description,
        payment_methods: data.payment_methods,
        payment_timeframes: data.payment_timeframes,
        legal_company_name: data.legal_company_name,
        company_registration_number: data.company_registration_number,
        gst_number: data.gst_number,
        is_gst_registered: data.is_gst_registered,
        is_individual_carrier: data.is_individual_carrier,
        service_categories: data.service_categories,
        address_type: data.address_type,
        address_line1: data.address_line1,
        address_line2: data.address_line2,
        city: data.city,
        postcode: data.postcode,
        country: data.country,
        slug,
        application_status: 'active',
        submitted_at: new Date().toISOString(),
      })

    if (insertError) {
      setError('root', { message: insertError.message })
      return
    }

    router.push('/dashboard/carrier')
    router.refresh()
  }

  // ── Render ─────────────────────────────────────────────────────────

  const inputClass = (field) =>
    `w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-300'
    }`

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="text-red-500 text-xs mt-1">{errors[name].message}</p>
    ) : null

  // Toggle button chip for array fields
  function ArrayToggle({ name, options }) {
    return (
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <>
            <div className="flex flex-wrap gap-2">
              {options.map((opt) => {
                const value = typeof opt === 'string' ? opt : opt.value
                const label = typeof opt === 'string' ? opt : opt.label
                const selected = field.value.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const arr = selected
                        ? field.value.filter((v) => v !== value)
                        : [...field.value, value]
                      field.onChange(arr)
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      selected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            <FieldError name={name} />
          </>
        )}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Carrier Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Join as a transport company or independent carrier
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${i < step ? 'bg-blue-600 border-blue-600 text-white' : ''}
                  ${i === step ? 'bg-white border-blue-600 text-blue-600' : ''}
                  ${i > step ? 'bg-white border-gray-300 text-gray-400' : ''}
                `}
              >
                {i < step ? '✓' : i + 1}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  i === step ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          {errors.root && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {errors.root.message}
            </div>
          )}

          {/* ── Step 0: Identity ─────────────────────────────── */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name *
                  </label>
                  <input
                    {...register('first_name')}
                    className={inputClass('first_name')}
                    placeholder="First name"
                  />
                  <FieldError name="first_name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name *
                  </label>
                  <input
                    {...register('last_name')}
                    className={inputClass('last_name')}
                    placeholder="Last name"
                  />
                  <FieldError name="last_name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of birth *
                </label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className={inputClass('date_of_birth')}
                />
                <FieldError name="date_of_birth" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={inputClass('email')}
                  placeholder="you@company.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  We never share it with other users.
                </p>
                <FieldError name="email" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`${inputClass('password')} pr-10`}
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
                <FieldError name="password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`${inputClass('confirmPassword')} pr-10`}
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
                <FieldError name="confirmPassword" />
              </div>
            </div>
          )}

          {/* ── Step 1: Address ───────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Your Address</h2>
              <div className="flex gap-4">
                {['personal', 'company'].map((type) => (
                  <label
                    key={type}
                    className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-sm font-medium text-center transition ${
                      watchAddressType === type
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('address_type')}
                      value={type}
                      className="sr-only"
                    />
                    {type === 'personal' ? '🏠 Personal' : '🏢 Company'}
                  </label>
                ))}
              </div>
              <FieldError name="address_type" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 1 *
                </label>
                <input
                  {...register('address_line1')}
                  className={inputClass('address_line1')}
                  placeholder="Street address"
                />
                <FieldError name="address_line1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 2
                </label>
                <input
                  {...register('address_line2')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Apartment, suite, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    {...register('city')}
                    className={inputClass('city')}
                    placeholder="City"
                  />
                  <FieldError name="city" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <input
                    {...register('postcode')}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Postcode"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  {...register('country')}
                  className={inputClass('country')}
                />
                <FieldError name="country" />
              </div>
            </div>
          )}

          {/* ── Step 2: Profile ───────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Public Profile</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public profile name *
                </label>
                <input
                  {...register('public_name')}
                  className={inputClass('public_name')}
                  placeholder="How you'll appear to customers"
                />
                <FieldError name="public_name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile description
                </label>
                <textarea
                  {...register('profile_description')}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell customers about your business and what makes you stand out..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment methods accepted *
                </label>
                <ArrayToggle name="payment_methods" options={PAYMENT_METHODS} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment timeframes *
                </label>
                <ArrayToggle name="payment_timeframes" options={PAYMENT_TIMEFRAMES} />
              </div>
            </div>
          )}

          {/* ── Step 3: Company ───────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Company Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal company name
                </label>
                <input
                  {...register('legal_company_name')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registered business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company registration number
                </label>
                <input
                  {...register('company_registration_number')}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST number
                </label>
                <input
                  {...register('gst_number')}
                  disabled={!watchIsGst}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="GST registration number"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_gst_registered')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">GST registered</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('is_individual_carrier')}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Operating as an individual carrier (not a company)
                </span>
              </label>
            </div>
          )}

          {/* ── Step 4: Categories ─────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Service Categories
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Select at least one category you operate in.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Controller
                  name="service_categories"
                  control={control}
                  render={({ field }) => (
                    <>
                      {SERVICE_CATEGORIES.map(({ value, label }) => {
                        const selected = field.value.includes(value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              const arr = selected
                                ? field.value.filter((v) => v !== value)
                                : [...field.value, value]
                              field.onChange(arr)
                            }}
                            className={`px-4 py-2.5 rounded-lg text-sm border text-left transition ${
                              selected
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </>
                  )}
                />
              </div>
              <FieldError name="service_categories" />
            </div>
          )}

          {/* ── Step 5: Finish ─────────────────────────────────── */}
          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">🚚</div>
              <h2 className="text-xl font-bold text-gray-900">
                Submit your application
              </h2>
              <p className="text-sm text-gray-500">
                By proceeding you agree to the Terms of Use and Privacy Policy.
                Your application will be reviewed before your profile goes live.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Name:</span>{' '}
                  {watch('first_name')} {watch('last_name')}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {watch('email')}
                </p>
                <p>
                  <span className="font-medium">City:</span> {watch('city')},{' '}
                  {watch('country')}
                </p>
                <p>
                  <span className="font-medium">Public name:</span>{' '}
                  {watch('public_name')}
                </p>
                <p>
                  <span className="font-medium">Services:</span>{' '}
                  {watch('service_categories').join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation buttons ─────────────────────────────── */}
          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={prevStep}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Back
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm text-gray-500 hover:underline self-center"
              >
                Already registered?
              </Link>
            )}

            {step < 5 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
