import { DollarSign } from 'lucide-react'

interface SpendingHeaderProps {
  transactionCount: number;
  totalSpending: number;
}

export const SpendingHeader = ({ transactionCount, totalSpending }: SpendingHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Monthly Spending Analysis</h1>
        <p className="text-slate-600">{transactionCount} total transactions</p>
      </div>
      <div className="bg-blue-50 p-4 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
          <DollarSign size={16} />
          <span className="font-medium">Total Spending</span>
        </div>
        <div className="text-3xl font-bold text-blue-700">${totalSpending.toFixed(2)}</div>
      </div>
    </div>
  )
}
