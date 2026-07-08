import { useState } from 'react'

const initial = {
  step: 1,
  jobType: null,
  // Pickup
  pickupAddress: '',
  pickupLat: null,
  pickupLng: null,
  pickupCity: '',
  pickupState: '',
  pickupCountry: '',
  pickupPostcode: '',
  // Delivery
  deliveryAddress: '',
  deliveryLat: null,
  deliveryLng: null,
  deliveryCity: '',
  deliveryState: '',
  deliveryCountry: '',
  deliveryPostcode: '',
  // Date
  moveDateType: 'flexible',
  moveDateFrom: '',
  moveDateTo: '',
  // Details
  pickupFloor: 'Ground floor',
  itemLoading: 'Requires 1 person to load',
  deliveryFloor: 'Ground floor',
  itemUnloading: 'Requires 1 person to unload',
  items: [],
  photos: [],
  description: '',
}

export function useJobWizard() {
  const [state, setState] = useState(initial)

  const update = (fields) => {
    setState((prev) => ({
      ...prev,
      ...fields,
    }))
  }

  const nextStep = () => {
    setState((prev) => ({
      ...prev,
      step: prev.step + 1,
    }))
  }

  const prevStep = () => {
    setState((prev) => ({
      ...prev,
      step: prev.step - 1,
    }))
  }

  const reset = () => {
    setState(initial)
  }

  return {
    state,
    update,
    nextStep,
    prevStep,
    reset,
  }
}
