import { z } from 'zod'

// ── Reusable field validators ──────────────────────────────────────────

const emailField = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')

const passwordMin6 = z
  .string()
  .min(1, 'Password is required')
  .min(6, 'Password must be at least 6 characters')

const passwordMin8 = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')

const confirmPassword = z
  .string()
  .min(1, 'Please confirm your password')

// NZ phone: +64 or 0 prefix, digit 2-9 (mobile/landline), 7-9 more digits
// Accepts spaces — they get stripped before regex
const nzPhoneRegex = /^(?:\+64|0)[2-9]\d{6,9}$/

const phoneField = z
  .string()
  .min(1, 'Phone number is required')
  .transform((val) => val.replace(/\s+/g, ''))
  .pipe(
    z.string().regex(nzPhoneRegex, 'Please enter a valid NZ phone number (e.g. 021 234 5678)'),
  )

const firstName = z.string().min(1, 'First name is required')
const lastName = z.string().min(1, 'Last name is required')

// ── Login schema ───────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: passwordMin6,
})

// ── Customer register schema ───────────────────────────────────────────

export const registerSchema = z
  .object({
    first_name: firstName,
    email: emailField,
    phone: phoneField,
    timezone: z.string().min(1, 'Timezone is required'),
    password: passwordMin8,
    confirmPassword,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

// ── Carrier register: per-step schemas ─────────────────────────────────

export const carrierIdentitySchema = z
  .object({
    first_name: firstName,
    last_name: lastName,
    date_of_birth: z
      .string()
      .min(1, 'Date of birth is required')
      .refine((dob) => {
        const date = new Date(dob)
        return date <= new Date()
      }, 'Date of birth cannot be in the future')
      .refine((dob) => {
        const date = new Date(dob)
        const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        return age >= 16
      }, 'You must be at least 16 years old'),
    email: emailField,
    password: passwordMin8,
    confirmPassword,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const carrierAddressSchema = z.object({
  address_type: z.enum(['personal', 'company']),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
})

export const carrierProfileSchema = z.object({
  public_name: z.string().min(1, 'Public profile name is required'),
  profile_description: z.string().optional(),
  payment_methods: z
    .array(z.string())
    .min(1, 'Select at least one payment method'),
  payment_timeframes: z
    .array(z.string())
    .min(1, 'Select at least one payment timeframe'),
})

export const carrierCompanySchema = z.object({
  legal_company_name: z.string().optional(),
  company_registration_number: z.string().optional(),
  gst_number: z.string().optional(),
  is_gst_registered: z.boolean(),
  is_individual_carrier: z.boolean(),
})

export const carrierCategoriesSchema = z.object({
  service_categories: z
    .array(z.string())
    .min(1, 'Select at least one service category'),
})

// Full carrier registration schema (all steps combined)
export const carrierRegisterSchema = z.object({
  ...carrierIdentitySchema.shape,
  ...carrierAddressSchema.shape,
  ...carrierProfileSchema.shape,
  ...carrierCompanySchema.shape,
  ...carrierCategoriesSchema.shape,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ── Field name arrays for per-step trigger() ───────────────────────────

export const CARRIER_STEP_FIELDS = {
  0: [
    'first_name',
    'last_name',
    'date_of_birth',
    'email',
    'password',
    'confirmPassword',
  ],
  1: ['address_type', 'address_line1', 'city', 'postcode', 'country'],
  2: ['public_name', 'payment_methods', 'payment_timeframes'],
  3: ['legal_company_name', 'company_registration_number', 'gst_number'],
  4: ['service_categories'],
}

// ── Server-side: carrier register API body schema ──────────────────────

export const carrierApiSchema = z.object({
  displayName: z.string().min(1, 'Display name is required'),
  bio: z.string().optional(),
  paymentMethods: z
    .array(z.string())
    .min(1, 'At least one payment method is required'),
  companyName: z.string().optional(),
  companyRegNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  categories: z
    .array(z.string())
    .min(1, 'At least one service category is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  region: z.string().optional(),
  postcode: z.string().optional(),
})
