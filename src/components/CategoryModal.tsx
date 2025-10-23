import { useMemo } from 'react'
import { Transaction } from '../types'

interface CategoryModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  transactions: Transaction[];
  onClose: () => void;
  onCategoryChange: (transaction: Transaction, newCategory: string) => void;
}

export const CategoryModal = ({
  isOpen,
  transaction,
  transactions,
  onClose,
  onCategoryChange
}: CategoryModalProps) => {
  // Extract unique categories from all transactions
  const allCategories = useMemo(() => {
    const categories = new Set(transactions.map(t => t.category))
    return Array.from(categories).sort()
  }, [transactions])

  if (!isOpen || !transaction) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-800 mb-4">Change Category</h3>
        
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">Merchant</div>
          <div className="font-semibold text-slate-800">{transaction.merchant}</div>
          <div className="text-xs text-slate-500 mt-2">
            Updates {transactions.filter(t => t.merchant === transaction.merchant).length} transaction(s)
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-2">Select new category:</div>
        <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto mb-4">
          {allCategories.map((cat) => (
            <button 
              key={cat} 
              onClick={() => onCategoryChange(transaction, cat)} 
              className={`p-3 rounded-lg text-left text-sm ${
                transaction.category === cat 
                  ? 'bg-blue-500 text-white font-semibold' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
