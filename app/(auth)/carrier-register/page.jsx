'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '../../lib/supabase/client'

const STEPS = [
  'Identity',
  'Address',
  'Profile',
  'Company',
  'Categories',
  'Finish',
]

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

const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Bank Transfer',
  'PayPal',
  'Cheque',
]
const PAYMENT_TIMEFRAMES = [
  'Before collection',
  'At collection',
  'At delivery',
  'After delivery',
]

export default function CarrierRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    // Step 0 - Identity
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    password: '',
    // Step 1 - Address
    address_type: 'personal',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
    country: 'New Zealand',
    // Step 2 - Profile
    public_name: '',
    profile_description: '',
    payment_methods: [],
    payment_timeframes: [],
    // Step 3 - Company
    legal_company_name: '',
    company_registration_number: '',
    gst_number: '',
    is_gst_registered: true,
    is_individual_carrier: false,
    // Step 4 - Categories
    service_categories: [],
  })

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function toggleArrayItem(field, value) {
    setForm((prev) => {
      const arr = prev[field]
      return {
        ...prev,
        [field]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      }
    })
  }

  function validateStep() {
    if (step === 0) {
      if (
        !form.first_name ||
        !form.last_name ||
        !form.email ||
        !form.password ||
        !form.date_of_birth
      ) {
        setError('Please fill in all required fields.')
        return false
      }
    }
    if (step === 1) {
      if (!form.address_line1 || !form.city || !form.country) {
        setError('Please fill in your address.')
        return false
      }
    }
    if (step === 2) {
      if (!form.public_name) {
        setError('Please enter your public profile name.')
        return false
      }
    }
    if (step === 4) {
      if (form.service_categories.length === 0) {
        setError('Please select at least one service category.')
        return false
      }
    }
    setError('')
    return true
  }

  function nextStep() {
    if (validateStep()) setStep((s) => s + 1)
  }

  function prevStep() {
    setError('')
    setStep((s) => s - 1)
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')

    // 1. Sign up with carrier role metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: 'carrier',
          first_name: form.first_name,
        },
      },
    })

    if (signUpError) {
      console.error('signUp error:', signUpError)
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (!data?.user) {
      setError('Registration failed. Please try again.')
      setLoading(false)
      return
    }

    // 2. Wait for trigger to create profiles row, then check once
    await new Promise((r) => setTimeout(r, 1000))

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .single()

    if (profileError || !profile) {
      console.error('profile fetch error:', profileError)
      setError('Account created but profile setup failed. Please try logging in.')
      setLoading(false)
      return
    }

    // 3. Update profiles with last_name and date_of_birth
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        last_name: form.last_name,
        date_of_birth: form.date_of_birth,
      })
      .eq('id', data.user.id)

    if (updateError) {
      console.error('profile update error:', updateError)
      setError(updateError.message)
      setLoading(false)
      return
    }

    // 4. Generate slug from public_name
    const slugBase = form.public_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
    const slug = `${slugBase}-${data.user.id.slice(-4)}`

    // 5. Insert into carrier_profiles (all fields from form, plus required slug + status)
    const { error: insertError } = await supabase
      .from('carrier_profiles')
      .insert({
        id: data.user.id,
        public_name: form.public_name,
        profile_description: form.profile_description,
        payment_methods: form.payment_methods,
        payment_timeframes: form.payment_timeframes,
        legal_company_name: form.legal_company_name,
        company_registration_number: form.company_registration_number,
        gst_number: form.gst_number,
        is_gst_registered: form.is_gst_registered,
        is_individual_carrier: form.is_individual_carrier,
        service_categories: form.service_categories,
        address_type: form.address_type,
        address_line1: form.address_line1,
        address_line2: form.address_line2,
        city: form.city,
        postcode: form.postcode,
        country: form.country,
        slug,
        application_status: 'active',
        submitted_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('carrier_profiles insert error:', insertError)
      setError(insertError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    router.push('/dashboard/carrier')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-8 pb-10">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Carrier Registration
          </h1>
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
                className={`text-xs mt-1 hidden sm:block ${i === step ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          {/* Step 0 — Identity */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Identity
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First name *
                  </label>
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last name *
                  </label>
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of birth *
                </label>
                <input
                  name="date_of_birth"
                  type="date"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@company.com"
                />
                <p className="text-xs text-gray-400 mt-1">
                  We never share it with other users.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>
            </div>
          )}

          {/* Step 1 — Address */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Your Address
              </h2>
              <div className="flex gap-4">
                {['personal', 'company'].map((type) => (
                  <label
                    key={type}
                    className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-sm font-medium text-center transition
                    ${form.address_type === type ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-500'}`}
                  >
                    <input
                      type="radio"
                      name="address_type"
                      value={type}
                      checked={form.address_type === type}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    {type === 'personal' ? '🏠 Personal' : '🏢 Company'}
                  </label>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 1 *
                </label>
                <input
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address line 2
                </label>
                <input
                  name="address_line2"
                  value={form.address_line2}
                  onChange={handleChange}
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
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postcode
                  </label>
                  <input
                    name="postcode"
                    value={form.postcode}
                    onChange={handleChange}
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
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Profile */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Public Profile
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Public profile name *
                </label>
                <input
                  name="public_name"
                  value={form.public_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How you'll appear to customers"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile description
                </label>
                <textarea
                  name="profile_description"
                  value={form.profile_description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Tell customers about your business and what makes you stand out..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment methods accepted
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => toggleArrayItem('payment_methods', method)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition
                        ${
                          form.payment_methods.includes(method)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment timeframes
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => toggleArrayItem('payment_timeframes', tf)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition
                        ${
                          form.payment_timeframes.includes(tf)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Company */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Company Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Legal company name
                </label>
                <input
                  name="legal_company_name"
                  value={form.legal_company_name}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Registered business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company registration number
                </label>
                <input
                  name="company_registration_number"
                  value={form.company_registration_number}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1234567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST number
                </label>
                <input
                  name="gst_number"
                  value={form.gst_number}
                  onChange={handleChange}
                  disabled={!form.is_gst_registered}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
                  placeholder="GST registration number"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_gst_registered"
                  checked={form.is_gst_registered}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">GST registered</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_individual_carrier"
                  checked={form.is_individual_carrier}
                  onChange={handleChange}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Operating as an individual carrier (not a company)
                </span>
              </label>
            </div>
          )}

          {/* Step 4 — Categories */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Service Categories
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Select at least one category you operate in.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SERVICE_CATEGORIES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleArrayItem('service_categories', value)}
                    className={`px-4 py-2.5 rounded-lg text-sm border text-left transition
                      ${
                        form.service_categories.includes(value)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Finish */}
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
                  <span className="font-medium">Name:</span> {form.first_name}{' '}
                  {form.last_name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {form.email}
                </p>
                <p>
                  <span className="font-medium">City:</span> {form.city},{' '}
                  {form.country}
                </p>
                <p>
                  <span className="font-medium">Public name:</span>{' '}
                  {form.public_name}
                </p>
                <p>
                  <span className="font-medium">Services:</span>{' '}
                  {form.service_categories.join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
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
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
