export default function CarrierPendingPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">⏳</div>

      <h1 className="text-2xl font-bold mb-3">Application submitted!</h1>

      <p className="text-gray-500 mb-6">
        Your carrier profile is under review. We typically approve applications
        within 24 hours. You will receive an email once you are approved and can
        start quoting on jobs.
      </p>

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-left text-sm space-y-2">
        <p className="font-medium text-gray-700">What happens next:</p>

        <p className="text-gray-500">
          1. Our team reviews your profile and details
        </p>

        <p className="text-gray-500">
          2. You get an email confirmation when approved
        </p>

        <p className="text-gray-500">
          3. You can start browsing and quoting on jobs
        </p>
      </div>
    </main>
  )
}
