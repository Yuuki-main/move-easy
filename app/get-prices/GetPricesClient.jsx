'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useJobWizard } from '@/hooks/useJobWizard'
import Step1JobType from './steps/Step1JobType'
import Step2Addresses from './steps/Step2Addresses'
import Step3Items from './steps/Step3Items'
import Step4Review from './steps/Step4Review'

const STEP_LABELS = ['Job type', 'Location', 'Details', 'Review']
const steps = [Step1JobType, Step2Addresses, Step3Items, Step4Review]

function GetPricesInner() {
  const wizard = useJobWizard()
  const searchParams = useSearchParams()
  const CurrentStep = steps[wizard.state.step - 1]

  useEffect(() => {
    const type = searchParams.get('type')
    if (type && !wizard.state.jobType) {
      wizard.update({ jobType: type, step: 2 })
    }
  }, [searchParams])

  return (
    <main className="max-w-xl mx-auto px-4 pb-16 pt-8">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">
          {STEP_LABELS[wizard.state.step - 1]}
        </span>
        <span className="text-sm text-gray-400">
          {wizard.state.step} / {steps.length}
        </span>
      </div>

      <div className="flex gap-1.5 mb-10">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              index < wizard.state.step ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <CurrentStep wizard={wizard} />
    </main>
  )
}

export default function GetPricesClient() {
  return (
    <Suspense>
      <GetPricesInner />
    </Suspense>
  )
}
