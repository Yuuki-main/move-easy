import { z } from 'zod'

// ── Timezone options ────────────────────────────────────────────────
export const TIMEZONE_OPTIONS = [
  { value: 'Pacific/Auckland', label: 'NZ — Auckland / Wellington (UTC+12)' },
  { value: 'Pacific/Chatham', label: 'NZ — Chatham Islands (UTC+12:45)' },
  { value: 'Australia/Sydney', label: 'AU — Sydney / Melbourne (UTC+10/11)' },
  { value: 'Australia/Brisbane', label: 'AU — Brisbane (UTC+10)' },
  { value: 'Australia/Perth', label: 'AU — Perth (UTC+8)' },
  { value: 'Pacific/Fiji', label: 'Fiji (UTC+12)' },
]

// ── Country code options ────────────────────────────────────────────
export const COUNTRY_CODES = [
  { value: '+64', label: 'NZ +64' },
  { value: '+61', label: 'AU +61' },
  { value: '+1', label: 'US +1' },
  { value: '+44', label: 'UK +44' },
]

// ── Document types ──────────────────────────────────────────────────
export const DOCUMENT_TYPES = [
  { value: 'proof_of_address', label: 'Proof of address' },
  { value: 'driving_license', label: 'Driving license' },
  { value: 'identity', label: 'Identity document' },
  { value: 'other', label: 'Other' },
]

// ── Job categories (nested groups) ──────────────────────────────────
export const JOB_CATEGORY_GROUPS = [
  {
    group: 'Item',
    options: [
      { value: 'furniture_item', label: 'Furniture / Item' },
      { value: 'item', label: 'Parcel / Item' },
    ],
  },
  {
    group: 'Move',
    options: [
      { value: 'home_move', label: 'Home Move' },
      { value: 'office_move', label: 'Office Move' },
      { value: 'storage', label: 'Storage' },
    ],
  },
  {
    group: 'Vehicle',
    options: [
      { value: 'car', label: 'Car' },
      { value: 'motorcycle', label: 'Motorcycle' },
      { value: 'other_vehicle', label: 'Other Vehicle' },
    ],
  },
  {
    group: 'Specialty',
    options: [
      { value: 'boat', label: 'Boat' },
      { value: 'piano', label: 'Piano' },
      { value: 'pet', label: 'Pet Transport' },
      { value: 'junk', label: 'Junk Removal' },
      { value: 'other', label: 'Other' },
    ],
  },
]

// Flattened array for Zod enum
export const ALL_JOB_CATEGORIES = JOB_CATEGORY_GROUPS.flatMap((g) =>
  g.options.map((o) => o.value),
)

// ── Tab 1: Identity ─────────────────────────────────────────────────
export const identitySchema = z.object({
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  last_name: z.string().optional(),
  date_of_birth: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), 'Invalid date format'),
  timezone: z.string().min(1, 'Timezone is required'),
  new_password: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length >= 8,
      'Password must be at least 8 characters',
    ),
})

// ── Tab 2: Profile ──────────────────────────────────────────────────
export const profileSchema = z.object({
  public_name: z.string().min(1, 'Public profile name is required'),
  profile_description: z.string().optional(),
  payment_methods: z.array(z.string()).min(1, 'Select at least one payment method'),
})

// ── Tab 3: Telephone ────────────────────────────────────────────────
export const telephoneSchema = z.object({
  country_code: z.string().min(1, 'Country code is required'),
  number: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^\d{6,15}$/, 'Enter a valid phone number (digits only)'),
  type: z.enum(['mobile', 'landline']),
})

// ── Tab 4: Company ──────────────────────────────────────────────────
export const companySchema = z.object({
  legal_company_name: z.string().optional(),
  company_registration_number: z.string().optional(),
  gst_number: z.string().optional(),
  is_gst_registered: z.boolean(),
  is_individual_carrier: z.boolean(),
})

// ── Tab 5: Location ─────────────────────────────────────────────────
export const locationSchema = z.object({
  address_type: z.enum(['personal', 'company']),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
})

// ── Tab 6: Notifications ────────────────────────────────────────────
export const notificationsSchema = z.object({
  job_categories: z.array(z.string()).optional(),
  email_frequency: z.enum(['instantly', 'hourly', 'daily', 'never']),
  updates_opt_in: z.boolean(),
  operational_area: z.any().nullable().optional(),
})

// ── Tab 8: Insurance (add form) ─────────────────────────────────────
export const insuranceSchema = z.object({
  provider_name: z.string().min(1, 'Provider name is required'),
  coverage_amount: z
    .string()
    .optional()
    .transform((v) => (v ? parseFloat(v) : null)),
})
