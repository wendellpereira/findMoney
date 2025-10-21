import { useState } from 'react';
import { useTransactionData } from '../hooks/useTransactionData';
import { DataManagement } from './DataManagement';
import { SpendingHeader } from './SpendingHeader';
import { Charts } from './Charts';
import { TransactionTable } from './TransactionTable';
import { CategoryModal } from './CategoryModal';

function SpendingCategorizer() {
  const {
    transactions,
    categoryRules,
    statements,
    selectedCategory,
    setSelectedCategory,
    categoryData,
    totalSpending,
    filteredTransactions,
    updateTransactionCategory,
    importCategoryRules
  } = useTransactionData();

  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const handleCategoryChange = (transaction: any, newCategory: string) => {
    updateTransactionCategory(transaction, newCategory);
    setShowCategoryModal(false);
    setEditingTransaction(null);
  };

  const openCategoryModal = (transaction: any) => {
    setEditingTransaction(transaction);
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingTransaction(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <DataManagement 
          statements={statements}
          categoryRules={categoryRules}
          transactions={transactions}
          onImportRules={importCategoryRules}
        />

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <SpendingHeader 
            transactionCount={transactions.length}
            totalSpending={totalSpending}
          />

          <Charts categoryData={categoryData} />

          <TransactionTable 
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onOpenCategoryModal={openCategoryModal}
          />
        </div>

        <CategoryModal 
          isOpen={showCategoryModal}
          transaction={editingTransaction}
          transactions={transactions}
          onClose={closeCategoryModal}
          onCategoryChange={handleCategoryChange}
        />
      </div>
    </div>
  );
}

export default SpendingCategorizer;``