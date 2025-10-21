import { Transaction } from '../types';

interface TransactionTableProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onOpenCategoryModal: (transaction: Transaction) => void;
}

export const TransactionTable = ({ 
  transactions, 
  filteredTransactions, 
  selectedCategory, 
  onCategoryChange, 
  onOpenCategoryModal 
}: TransactionTableProps) => {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-700">Transaction Details</h2>
        <select 
          value={selectedCategory} 
          onChange={(e) => onCategoryChange(e.target.value)} 
          className="px-4 py-2 border border-slate-300 rounded-lg"
        >
          <option value="all">All Categories ({transactions.length})</option>
          {Array.from(new Set(transactions.map(t => t.category))).map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="overflow-auto max-h-96 border border-slate-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-slate-100 sticky top-0">
            <tr>
              <th className="text-left p-3 text-sm font-semibold text-slate-700">Date</th>
              <th className="text-left p-3 text-sm font-semibold text-slate-700">Description</th>
              <th className="text-left p-3 text-sm font-semibold text-slate-700">Category</th>
              <th className="text-right p-3 text-sm font-semibold text-slate-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((t, idx) => (
              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-3 text-sm text-slate-600">{t.date}</td>
                <td className="p-3">
                  <div className="text-sm text-slate-800 font-medium">{t.description}</div>
                  {t.address && <div className="text-xs text-slate-500 mt-1">{t.address}</div>}
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => onOpenCategoryModal(t)} 
                    className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full hover:bg-blue-200"
                  >
                    {t.category}
                  </button>
                </td>
                <td className="p-3 text-sm font-semibold text-slate-800 text-right">
                  ${t.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
