/**
 * Address-related TypeScript interfaces.
 *
 * Central type definitions for the address autocomplete system.
 * Every component, hook, and utility consumes these types.
 *
 * @module types/address
 */

// ---------------------------------------------------------------------------
// Address suggestion (returned by Photon API + exposed to parent)
// ---------------------------------------------------------------------------

/** A single address suggestion returned by the geocoding API. */
export interface AddressSuggestion {
  /** Full formatted address string (e.g. "123 Main St, Christchurch, NZ"). */
  address: string

  /** Latitude in decimal degrees. */
  latitude: number

  /** Longitude in decimal degrees. */
  longitude: number

  /** City / locality name (optional — may be absent for rural addresses). */
  city?: string

  /** State / region / province name (optional). */
  state?: string

  /** Country name (optional). */
  country?: string

  /** Postal / ZIP code (optional). */
  postcode?: string
}

// ---------------------------------------------------------------------------
// Photon API response shapes (internal)
// ---------------------------------------------------------------------------

/**
 * Raw feature properties returned by the Photon API.
 *
 * @see https://photon.komoot.io/
 * @internal — not exported from the library
 */
export interface PhotonFeatureProperties {
  name?: string
  city?: string
  state?: string
  country?: string
  postcode?: string
  street?: string
  housenumber?: string
  district?: string
  county?: string
  osm_id?: number
  osm_type?: string
  [key: string]: unknown
}

/**
 * A single GeoJSON feature from the Photon response.
 *
 * @internal
 */
export interface PhotonFeature {
  properties: PhotonFeatureProperties
  geometry: {
    coordinates: [number, number] // [longitude, latitude]
    type: 'Point'
  }
  type: 'Feature'
}

/**
 * Top-level Photon API response.
 *
 * @internal
 */
export interface PhotonResponse {
  features: PhotonFeature[]
  type: 'FeatureCollection'
}

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

/** Configuration options for the `useAddressAutocomplete` hook. */
export interface UseAddressAutocompleteOptions {
  /** Debounce delay in milliseconds before firing an API request. @default 300 */
  debounceMs?: number

  /** Minimum character count before a search is triggered. @default 3 */
  minChars?: number

  /** Maximum number of suggestions to return. @default 5 */
  limit?: number

  /** Base URL for the Photon API. @default 'https://photon.komoot.io/api/' */
  apiUrl?: string
}

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------

/** Props accepted by the `<AddressAutocomplete />` component. */
export interface AddressAutocompleteProps {
  /** Current input value (controlled component). */
  value: string

  /** Called on every keystroke with the new input value. */
  onChange: (value: string) => void

  /** Called when the user selects a suggestion. Receives the full address object. */
  onSelect: (suggestion: AddressSuggestion) => void

  /** Placeholder text for the input. */
  placeholder?: string

  /** Whether the input is disabled. */
  disabled?: boolean

  /** Error message to display below the input. */
  error?: string

  /** Label text above the input. */
  label?: string

  /** Whether the field is required (adds a red asterisk). */
  required?: boolean

  /** HTML `name` attribute for the input element. */
  name?: string
}
