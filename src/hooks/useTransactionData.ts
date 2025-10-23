import { useState, useMemo, useEffect } from 'react'
import { Transaction, Statement, CategoryData } from '../types'
import { transactionsApi, statementsApi, ApiError } from '../services/api'

export const useTransactionData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [statements, setStatements] = useState<Statement[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
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

  const categoryData = useMemo((): CategoryData[] => {
    const grouped: Record<string, { value: number; count: number }> = {}

    transactions.forEach(t => {
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
  }, [transactions])

  const totalSpending = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0)
  }, [transactions])

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return transactions
    return transactions.filter((t) => t.category === selectedCategory)
  }, [transactions, selectedCategory])

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
