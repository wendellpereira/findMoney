import { useState } from 'react'
import { useTransactionData } from '../hooks/useTransactionData'
import { DataManagement } from './DataManagement'
import { SpendingHeader } from './SpendingHeader'
import { Charts } from './Charts'
import { TransactionTable } from './TransactionTable'
import { CategoryModal } from './CategoryModal'
import { TransactionFilters } from './TransactionFilters'
import { DescriptionEditModal } from './DescriptionEditModal'
import { transactionsApi } from '../services/api'
import { Transaction } from '../types'

function SpendingCategorizer() {
  const {
    transactions,
    statements,
    selectedCategory,
    setSelectedCategory,
    setFilters,
    categoryData,
    totalSpending,
    filteredTransactions,
    loading,
    error,
    updateTransactionCategory,
    exportData,
    refreshData
  } = useTransactionData()

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingDescription, setEditingDescription] = useState<string | null>(null)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)

  const handleCategoryChange = async (transaction: Transaction, newCategory: string) => {
    await updateTransactionCategory(transaction, newCategory)
    setShowCategoryModal(false)
    setEditingTransaction(null)
  }

  const openCategoryModal = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setShowCategoryModal(true)
  }

  const closeCategoryModal = () => {
    setShowCategoryModal(false)
    setEditingTransaction(null)
  }

  const openDescriptionModal = (description: string) => {
    setEditingDescription(description)
    setShowDescriptionModal(true)
  }

  const closeDescriptionModal = () => {
    setShowDescriptionModal(false)
    setEditingDescription(null)
  }

  const handleDescriptionUpdate = async (oldDescription: string, newDescription: string) => {
    await transactionsApi.bulkUpdateDescription(oldDescription, newDescription)
    // Refresh data to show updated descriptions
    await refreshData()
  }

  if (loading) {
    return (<Loading />)
  }

  if (error) {
    return (
      <Error error={error}/>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <DataManagement
          statements={statements}
          onExportData={exportData}
          onStatementsUpdated={refreshData}
        />

        <TransactionFilters
          transactions={transactions}
          statements={statements}
          onFilterChange={setFilters}
        />

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SpendingHeader
            transactionCount={filteredTransactions.length}
            totalSpending={totalSpending}
          />

          <Charts categoryData={categoryData} />

          <TransactionTable
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onOpenCategoryModal={openCategoryModal}
            onOpenDescriptionModal={openDescriptionModal}
          />
        </div>

        <CategoryModal
          isOpen={showCategoryModal}
          transaction={editingTransaction}
          transactions={transactions}
          onClose={closeCategoryModal}
          onCategoryChange={handleCategoryChange}
        />

        <DescriptionEditModal
          isOpen={showDescriptionModal}
          currentDescription={editingDescription || ''}
          onClose={closeDescriptionModal}
          onSave={handleDescriptionUpdate}
        />
      </div>
    </div>
  )
}

const Loading = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Loading...</h2>
        <p className="text-slate-600">Fetching your spending data</p>
      </div>
    </div>
  )
}

const Error = (props: {error: string | null}) => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Error Loading Data</h2>
          <p className="text-slate-600 mb-4">{props.error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    )
  
}
export default SpendingCategorizer;``