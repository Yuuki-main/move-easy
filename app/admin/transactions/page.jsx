import { createClient } from '@/lib/supabase/server'

const TYPE_STYLES = {
  topup: 'bg-green-100 text-green-700',
  fee_deduction: 'bg-red-100 text-red-600',
  refund: 'bg-blue-100 text-blue-700',
}

const TYPE_LABELS = {
  topup: '⬆️ Top-up',
  fee_deduction: '💸 Platform Fee',
  refund: '↩️ Refund',
}

export default async function AdminTransactionsPage() {
  const supabase = await createClient()

  const { data: transactions } = await supabase
    .from('wallet_transactions')
    .select(
      `
      *,
      carrier_profiles (
        public_name,
        city
      )
    `,
    )
    .order('created_at', { ascending: false })
    .limit(100)

  // Summary stats
  const topups = transactions?.filter((t) => t.type === 'topup') ?? []
  const fees = transactions?.filter((t) => t.type === 'fee_deduction') ?? []
  const totalTopups = topups.reduce((s, t) => s + Number(t.amount), 0)
  const totalFees = fees.reduce((s, t) => s + Number(t.amount), 0)

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">Transactions</h1>

      {/* Summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-2xl font-bold text-green-700">
            ₹{totalTopups.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total top-ups</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-2xl font-bold text-red-600">
            ₹{totalFees.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 mt-1">Platform fees collected</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-2xl font-bold text-gray-900">
            {transactions?.length ?? 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total transactions</p>
        </div>
      </div>

      {/* Transactions table */}
      {!transactions?.length ? (
        <p className="text-gray-400 text-sm text-center py-20">
          No transactions yet.
        </p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Carrier
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Type
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Description
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-800">
                      {tx.carrier_profiles?.public_name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {tx.carrier_profiles?.city ?? ''}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TYPE_STYLES[tx.type] ?? 'bg-gray-100 text-gray-500'}`}
                    >
                      {TYPE_LABELS[tx.type] ?? tx.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-500 max-w-[200px] truncate">
                    {tx.description}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`font-bold ${tx.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}
                    >
                      {tx.type === 'topup' ? '+' : '-'}₹
                      {Number(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-400 text-xs whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
