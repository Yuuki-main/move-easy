import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WalletTopup from './WalletTopupButton'

export default async function CarrierWalletPage({ searchParams }) {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = session.user
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

  const { success, cancelled, reason } = await searchParams

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {reason === 'insufficient-balance' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0 text-amber-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                Insufficient wallet balance
              </p>
              <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                You don&apos;t have enough wallet balance to submit this quote.
                Please add funds to your wallet and then submit your quote again.
              </p>
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-sm text-green-700">
          ✅ Wallet topped up successfully!
        </div>
      )}
      {cancelled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700">
          Payment cancelled.
        </div>
      )}

      {/* Balance card */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 mb-6">
        <p className="text-sm text-gray-400 mb-1">Available balance</p>
        <p className="text-4xl font-black">
          ${carrier?.wallet_balance?.toFixed(2) ?? '0.00'}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Used to cover 18% platform fee when you win a job
        </p>
      </div>

      {/* Top up options */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold text-lg mb-4">Add funds</h2>
        <p className="text-sm text-gray-500 mb-4">
          Enter an amount to add to your wallet via Stripe.
        </p>
        <WalletTopup />
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
