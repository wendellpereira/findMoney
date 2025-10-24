import { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle } from 'lucide-react'

interface Transaction {
  id: string
  merchant: string
  description: string
  address?: string
  category: string
}

interface DuplicateGroup {
  groupId: string
  date: string
  amount: number
  merchants: string[]
  transactions: Transaction[]
}

interface DeduplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onDeduplicate: (fixes: Array<{ groupId: string; canonicalMerchant: string; transactionIds: string[] }>) => Promise<void>
}

export const DeduplicationModal = ({ isOpen, onClose, onDeduplicate }: DeduplicationModalProps) => {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [selections, setSelections] = useState<{ [groupId: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && duplicates.length === 0) {
      analyzeTransactions()
    }
  }, [isOpen])

  const analyzeTransactions = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/admin/deduplicate-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze duplicates')
      }

      setDuplicates(data.duplicates)

      // Initialize selections with first merchant for each group
      const initialSelections: { [key: string]: string } = {}
      data.duplicates.forEach((group: DuplicateGroup) => {
        initialSelections[group.groupId] = group.merchants[0]
      })
      setSelections(initialSelections)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMerchant = (groupId: string, merchant: string) => {
    setSelections(prev => ({
      ...prev,
      [groupId]: merchant
    }))
  }

  const handleApplyFixes = async () => {
    try {
      setIsApplying(true)
      setError(null)

      const fixes = duplicates.map(group => ({
        groupId: group.groupId,
        canonicalMerchant: selections[group.groupId],
        transactionIds: group.transactions.map(t => t.id)
      }))

      await onDeduplicate(fixes)
      setSuccess(`Successfully deduplicated ${duplicates.length} groups!`)

      // Close modal after short delay
      setTimeout(() => {
        setDuplicates([])
        setSelections({})
        setSuccess(null)
        onClose()
      }, 2000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsApplying(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Deduplication Review</h2>
            <p className="text-sm text-slate-600 mt-1">
              {isLoading ? 'Analyzing transactions...' : `Found ${duplicates.length} groups with potential duplicates`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isApplying}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3 items-start">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-red-800 text-sm">{error}</div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3 items-start">
              <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-green-800 text-sm">{success}</div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
              <p className="text-slate-600">Analyzing transactions...</p>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No duplicates found!</p>
              <p className="text-sm text-slate-500 mt-1">Your data looks clean.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {duplicates.map((group, idx) => (
                <div key={group.groupId} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  {/* Group header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Group {idx + 1}</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {group.date} • ${group.amount.toFixed(2)} • {group.transactions.length} transactions
                      </div>
                    </div>
                    <div className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {group.merchants.length} merchants
                    </div>
                  </div>

                  {/* Merchant selector */}
                  <div className="mb-3">
                    <label className="text-xs font-semibold text-slate-700 block mb-2">Select canonical merchant:</label>
                    <select
                      value={selections[group.groupId] || ''}
                      onChange={(e) => handleSelectMerchant(group.groupId, e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {group.merchants.map((merchant) => (
                        <option key={merchant} value={merchant}>
                          {merchant}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction details */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-slate-700 block">Transactions:</div>
                    {group.transactions.map((txn) => (
                      <div
                        key={txn.id}
                        className={`text-xs p-2 rounded bg-white border-l-2 ${
                          txn.merchant === selections[group.groupId]
                            ? 'border-l-green-500 bg-green-50'
                            : 'border-l-orange-500 bg-orange-50'
                        }`}
                      >
                        <div className="font-medium text-slate-800">{txn.merchant}</div>
                        <div className="text-slate-600">{txn.description}</div>
                        {txn.address && <div className="text-slate-500 text-xs">{txn.address}</div>}
                        <div className="text-slate-500 mt-1 text-xs">
                          {txn.category} • ID: {txn.id.substring(0, 20)}...
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && duplicates.length > 0 && (
          <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isApplying}
              className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFixes}
              disabled={isApplying}
              className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50"
            >
              {isApplying ? 'Applying Fixes...' : 'Apply Deduplication'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
