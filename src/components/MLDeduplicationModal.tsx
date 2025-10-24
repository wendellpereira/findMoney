import { useState, useEffect } from 'react'
import { X, Zap, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react'

interface MLDuplicatePair {
  merchant1: string
  merchant2: string
  mlScore: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  recommendation: string
  algorithms: {
    jaroWinkler: number
    levenshtein: number
    jaccard: number
    prefix: number
    length: number
  }
}

interface MLDuplicateGroup {
  canonical: string
  variants: string[]
  count: number
  pairs: Array<{
    merchant1: string
    merchant2: string
    score: number
  }>
}

interface MLDeduplicationModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PairSelection {
  selected: boolean
  canonicalMerchant: string
}

export const MLDeduplicationModal = ({ isOpen, onClose }: MLDeduplicationModalProps) => {
  const [threshold, setThreshold] = useState(0.75)
  const [duplicatePairs, setDuplicatePairs] = useState<MLDuplicatePair[]>([])
  const [duplicateGroups, setDuplicateGroups] = useState<MLDuplicateGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pairs' | 'groups'>('pairs')
  const [autoConsolidate, setAutoConsolidate] = useState(false)
  const [selections, setSelections] = useState<{ [key: string]: PairSelection }>({})

  useEffect(() => {
    if (isOpen) {
      analyzeDuplicates()
    }
  }, [isOpen])

  const analyzeDuplicates = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch('/api/admin/ml-duplicate-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold, action: 'analyze' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze duplicates')
      }

      setDuplicatePairs(data.duplicatePairs)
      setDuplicateGroups(data.duplicateGroups)

      // Initialize selections with merchant2 as default canonical
      const initialSelections: { [key: string]: PairSelection } = {}
      data.duplicatePairs.forEach((pair: MLDuplicatePair, idx: number) => {
        const pairKey = `${idx}`
        initialSelections[pairKey] = {
          selected: false,
          canonicalMerchant: pair.merchant2
        }
      })
      setSelections(initialSelections)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSelection = (pairKey: string) => {
    setSelections(prev => ({
      ...prev,
      [pairKey]: {
        ...prev[pairKey],
        selected: !prev[pairKey]?.selected
      }
    }))
  }

  const handleSelectCanonical = (pairKey: string, merchant: string) => {
    setSelections(prev => ({
      ...prev,
      [pairKey]: {
        ...prev[pairKey],
        canonicalMerchant: merchant
      }
    }))
  }

  const handleAutoConsolidate = async () => {
    try {
      setIsApplying(true)
      setError(null)

      const response = await fetch('/api/admin/ml-duplicate-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold, action: 'consolidate' })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to consolidate')
      }

      setSuccess(
        data.consolidated > 0
          ? `Successfully consolidated ${data.consolidated} transactions!`
          : 'No high-confidence duplicates found at this threshold.'
      )

      // Re-analyze after consolidation
      setTimeout(() => {
        analyzeDuplicates()
      }, 1000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsApplying(false)
    }
  }

  const handleManualConsolidate = async () => {
    try {
      setIsApplying(true)
      setError(null)

      // Get selected pairs with their canonical merchants
      const selectedPairs = duplicatePairs
        .map((pair, idx) => ({ pair, idx }))
        .filter(({ idx }) => selections[`${idx}`]?.selected)
        .map(({ pair, idx }) => ({
          merchant1: pair.merchant1,
          merchant2: pair.merchant2,
          canonicalMerchant: selections[`${idx}`]?.canonicalMerchant || pair.merchant2
        }))

      if (selectedPairs.length === 0) {
        setError('Please select at least one pair to consolidate')
        setIsApplying(false)
        return
      }

      const response = await fetch('/api/admin/ml-duplicate-consolidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pairs: selectedPairs })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to consolidate')
      }

      setSuccess(
        `Successfully consolidated ${selectedPairs.length} merchant pairs (${data.transactionsUpdated} transactions updated)!`
      )

      // Re-analyze after consolidation
      setTimeout(() => {
        analyzeDuplicates()
      }, 1000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsApplying(false)
    }
  }

  const getSelectedCount = () => {
    return Object.values(selections).filter(s => s?.selected).length
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.85) return 'text-green-600'
    if (score >= 0.75) return 'text-yellow-600'
    return 'text-orange-600'
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <Zap className="text-blue-600" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">ML Duplicate Detection</h2>
              <p className="text-sm text-slate-600 mt-1">Machine learning powered merchant deduplication</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isApplying}
          >
            <X size={24} />
          </button>
        </div>

        {/* Threshold Control */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                ML Confidence Threshold: {(threshold * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={threshold}
                onChange={(e) => {
                  setThreshold(parseFloat(e.target.value))
                  setDuplicatePairs([])
                }}
                disabled={isLoading}
                className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>Conservative (0.95)</span>
                <span>Balanced (0.75)</span>
                <span>Aggressive (0.50)</span>
              </div>
            </div>
            <button
              onClick={analyzeDuplicates}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 whitespace-nowrap"
            >
              {isLoading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
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
              <p className="text-slate-600">Analyzing merchants with ML algorithms...</p>
            </div>
          ) : duplicatePairs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">No duplicates found!</p>
              <p className="text-sm text-slate-500 mt-1">
                Try adjusting the threshold to be more aggressive if you want to find more potential matches.
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('pairs')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'pairs'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Individual Pairs ({duplicatePairs.length})
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`px-4 py-2 font-medium text-sm ${
                    activeTab === 'groups'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Grouped View ({duplicateGroups.length})
                </button>
              </div>

              {/* Pairs Tab */}
              {activeTab === 'pairs' && (
                <div className="space-y-3">
                  {duplicatePairs.map((pair, idx) => {
                    const pairKey = `${idx}`
                    const pairSelection = selections[pairKey]
                    return (
                      <div key={idx} className={`bg-slate-50 rounded-lg p-4 border-2 ${pairSelection?.selected ? 'border-blue-400 bg-blue-50' : 'border-slate-200'} hover:border-slate-300`}>
                        <div className="flex items-start gap-4 mb-3">
                          <input
                            type="checkbox"
                            checked={pairSelection?.selected || false}
                            onChange={() => handleToggleSelection(pairKey)}
                            className="mt-1 w-4 h-4 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-sm text-slate-600">{pair.merchant1}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <TrendingUp size={14} className="text-blue-500" />
                              <span className="text-xs text-slate-500">matches</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="font-mono text-sm text-slate-600">{pair.merchant2}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <div className={`text-2xl font-bold ${getScoreColor(pair.mlScore)}`}>
                              {(pair.mlScore * 100).toFixed(1)}%
                            </div>
                            <div className={`text-xs font-semibold px-2 py-1 rounded mt-2 ${getConfidenceColor(pair.confidence)}`}>
                              {pair.confidence}
                            </div>
                          </div>
                        </div>

                        {pairSelection?.selected && (
                          <div className="mb-3 bg-white rounded-lg p-3 border border-blue-200">
                            <label className="text-xs font-semibold text-slate-700 block mb-2">Select canonical merchant:</label>
                            <select
                              value={pairSelection.canonicalMerchant}
                              onChange={(e) => handleSelectCanonical(pairKey, e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={pair.merchant1}>{pair.merchant1}</option>
                              <option value={pair.merchant2}>{pair.merchant2}</option>
                            </select>
                          </div>
                        )}

                        <div className="bg-white rounded p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Jaro-Winkler (position matching):</span>
                            <span className="font-semibold">{(pair.algorithms.jaroWinkler * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Levenshtein (edit distance):</span>
                            <span className="font-semibold">{(pair.algorithms.levenshtein * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Jaccard (word overlap):</span>
                            <span className="font-semibold">{(pair.algorithms.jaccard * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Prefix (common start):</span>
                            <span className="font-semibold">{(pair.algorithms.prefix * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Length (similarity):</span>
                            <span className="font-semibold">{(pair.algorithms.length * 100).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className="mt-3 text-xs">
                          <span className="font-semibold text-slate-700">Recommendation: </span>
                          <span className="text-slate-600">{pair.recommendation}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Groups Tab */}
              {activeTab === 'groups' && (
                <div className="space-y-4">
                  {duplicateGroups.map((group, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-slate-800">Group {idx + 1}</div>
                          <div className="text-sm text-slate-600 mt-1">Canonical: {group.canonical}</div>
                        </div>
                        <div className="text-right">
                          <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded text-sm font-semibold">
                            {group.count} variants
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 space-y-2">
                        {group.variants.map((variant, vIdx) => (
                          <div key={vIdx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-700">{variant}</span>
                            {vIdx > 0 && (
                              <span className={`text-xs font-semibold ${getScoreColor(group.pairs[vIdx - 1]?.score || 0)}`}>
                                {((group.pairs[vIdx - 1]?.score || 0) * 100).toFixed(1)}% match
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {duplicatePairs.length > 0 && (
          <div className="border-t border-slate-200 p-6 bg-slate-50">
            <div className="mb-4 flex gap-3 items-center">
              <div className="text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoConsolidate}
                  onChange={(e) => setAutoConsolidate(e.target.checked)}
                  className="mr-2"
                />
                <label className="text-slate-700">
                  Auto-consolidate only HIGH confidence matches (≥85%)
                </label>
              </div>
              {activeTab === 'pairs' && getSelectedCount() > 0 && (
                <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded">
                  {getSelectedCount()} pair{getSelectedCount() !== 1 ? 's' : ''} selected
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isApplying}
                className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              {activeTab === 'pairs' && getSelectedCount() > 0 && (
                <button
                  onClick={handleManualConsolidate}
                  disabled={isApplying}
                  className="px-4 py-2 text-white bg-green-500 hover:bg-green-600 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  <Zap size={16} />
                  {isApplying ? 'Consolidating...' : `Consolidate Selected (${getSelectedCount()})`}
                </button>
              )}
              <button
                onClick={handleAutoConsolidate}
                disabled={isApplying || duplicatePairs.length === 0}
                className="px-4 py-2 text-white bg-blue-500 hover:bg-blue-600 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
              >
                <Zap size={16} />
                {isApplying ? 'Consolidating...' : 'Auto-Consolidate HIGH Confidence'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
