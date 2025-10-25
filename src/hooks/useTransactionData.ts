import { useState, useMemo, useEffect } from 'react'
import { Transaction, Statement, CategoryData } from '../types'
import { transactionsApi, statementsApi, ApiError } from '../services/api'

export interface FilterState {
  years: number[]
  months: number[]
  statementIds: number[]
}

export const useTransactionData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filters, setFilters] = useState<FilterState>({ years: [], months: [], statementIds: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [transactionsData, statementsData] = await Promise.all([
        transactionsApi.getAll(),
        statementsApi.getAll()
      ])
      
      setTransactions(transactionsData)
      setStatements(statementsData)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to load data'
      setError(errorMessage)
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Apply date and statement filters
  const baseFilteredTransactions = useMemo(() => {
    let filtered = transactions

    // Filter by years
    if (filters.years.length > 0) {
      filtered = filtered.filter(t => {
        const year = new Date(t.date).getFullYear()
        return filters.years.includes(year)
      })
    }

    // Filter by months
    if (filters.months.length > 0) {
      filtered = filtered.filter(t => {
        const month = new Date(t.date).getMonth() + 1
        return filters.months.includes(month)
      })
    }

    // Filter by statements
    if (filters.statementIds.length > 0) {
      // Filter by statement_id foreign key
      filtered = filtered.filter(t => t.statement_id && filters.statementIds.includes(t.statement_id))
    }

    return filtered
  }, [transactions, filters, statements])

  const categoryData = useMemo((): CategoryData[] => {
    const grouped: Record<string, { value: number; count: number }> = {}

    baseFilteredTransactions.forEach(t => {
      if (!grouped[t.category]) {
        grouped[t.category] = { value: 0, count: 0 }
      }
      grouped[t.category].value += t.amount
      grouped[t.category].count += 1
    })

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      value: parseFloat(data.value.toFixed(2)),
      transaction_count: data.count
    })).sort((a, b) => b.value - a.value)
  }, [baseFilteredTransactions])

  const totalSpending = useMemo(() => {
    return baseFilteredTransactions.reduce((sum, t) => sum + t.amount, 0)
  }, [baseFilteredTransactions])

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return baseFilteredTransactions
    return baseFilteredTransactions.filter((t) => t.category === selectedCategory)
  }, [baseFilteredTransactions, selectedCategory])

  const updateTransactionCategory = async (transaction: Transaction, newCategory: string) => {
    try {
      await transactionsApi.bulkUpdateCategory(transaction.merchant, newCategory)
      
      // Reload transactions to get updated data
      const updatedTransactions = await transactionsApi.getAll()
      setTransactions(updatedTransactions)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update category'
      setError(errorMessage)
      console.error('Error updating category:', err)
    }
  }

  const exportData = async () => {
    try {
      const [transactionsData, statementsData] = await Promise.all([
        transactionsApi.getAll(),
        statementsApi.getAll()
      ])

      return {
        version: '1.0',
        exportDate: new Date().toISOString().split('T')[0],
        transactions: transactionsData,
        statements: statementsData
      }
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to export data'
      setError(errorMessage)
      console.error('Error exporting data:', err)
      throw err
    }
  }

  return {
    transactions,
    statements,
    selectedCategory,
    setSelectedCategory,
    filters,
    setFilters,
    categoryData,
    totalSpending,
    filteredTransactions,
    loading,
    error,
    updateTransactionCategory,
    exportData,
    refreshData: loadData
  }
}
