import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WalletTopup from './WalletTopupButton'

export default async function CarrierWalletPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: carrier } = await supabase
    .from('carrier_profiles')
    .select('wallet_balance, public_name')
    .eq('id', user.id)
    .single()

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('carrier_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const balance = carrier?.wallet_balance ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Balance card */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 mb-6">
        <p className="text-sm text-gray-400 mb-1">Available balance</p>
        <p className="text-4xl font-black">${balance.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-2">
          Used to cover 18% platform fee when you win a job
        </p>
      </div>

      {/* Empty wallet info card */}
      {balance === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6 flex items-start gap-3">
          <span className="mt-0.5 shrink-0 text-blue-500">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </span>
          <p className="text-sm text-blue-800">
            Your wallet is empty. Add funds before submitting quotes.
          </p>
        </div>
      )}

      {/* Top up options */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Add funds</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter an amount to add to your wallet via Stripe.
        </p>
        <Suspense fallback={null}>
          <WalletTopup />
        </Suspense>
      </div>

      {/* Transaction history */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-bold text-lg mb-4">Transaction history</h2>
        {!transactions?.length ? (
          <p className="text-sm text-gray-400">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {tx.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p
                  className={`font-bold text-sm ${tx.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}
                >
                  {tx.type === 'topup' ? '+' : '-'}${tx.amount}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
