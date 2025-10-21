import { useState, useMemo } from 'react';
import { Transaction, Statement, CategoryData } from '../types';

const generateId = (date: string, merchant: string, address: string, amount: number): string => {
  const key = date + merchant + (address || '') + amount;
  return btoa(key).substring(0, 20);
};

const makeRules = (txns: Transaction[]): Record<string, string> => {
  const rules: Record<string, string> = {};
  txns.forEach((t) => {
    if (!rules[t.merchant]) {
      rules[t.merchant] = t.category;
    }
  });
  return rules;
};

const startData: Transaction[] = [
  { date: '08/30/2025', description: 'ONSTREET 8090', address: '33 N 9TH ST MINNEAPOLIS', amount: 6.25, category: 'Transportation', merchant: 'ONSTREET', source: 'Apple Card - September 2025' },
  { date: '08/30/2025', description: 'TST*RED RABBIT', address: '201 N Washington Ave Minneapolis', amount: 121.79, category: 'Dining', merchant: 'TST*RED RABBIT', source: 'Apple Card - September 2025' },
  { date: '08/30/2025', description: 'IN *HELVIG PRODUCTIONS', address: '3880 LINDEN CIR', amount: 380.00, category: 'Entertainment', merchant: 'IN *HELVIG PRODUCTIONS', source: 'Apple Card - September 2025' },
  { date: '08/31/2025', description: 'DD *DOORDASH', address: '303 2ND STREET', amount: 56.51, category: 'Dining', merchant: 'DD *DOORDASH', source: 'Apple Card - September 2025' },
  { date: '09/01/2025', description: 'ALDI', address: '2601 LYNDALE AVE', amount: 50.99, category: 'Groceries', merchant: 'ALDI', source: 'Apple Card - September 2025' },
  { date: '09/02/2025', description: 'DD *DOORDASH', address: '303 2ND STREET', amount: 36.00, category: 'Dining', merchant: 'DD *DOORDASH', source: 'Apple Card - September 2025' },
  { date: '09/05/2025', description: 'SPEEDWAY', address: '2200 LYNDALE AVE S', amount: 51.40, category: 'Transportation', merchant: 'SPEEDWAY', source: 'Apple Card - September 2025' },
  { date: '09/06/2025', description: 'CHEWY.COM', address: '7700 West Sunrise Boulevard', amount: 33.54, category: 'Pet Care', merchant: 'CHEWY.COM', source: 'Apple Card - September 2025' },
  { date: '09/08/2025', description: 'NETFLIX.COM', address: 'SAO PAULO', amount: 8.34, category: 'Subscriptions', merchant: 'NETFLIX.COM', source: 'Apple Card - September 2025' },
  { date: '09/10/2025', description: 'BARNES & NOBLE', address: '3216 W LAKE ST', amount: 74.06, category: 'Shopping', merchant: 'BARNES & NOBLE', source: 'Apple Card - September 2025' },
  { date: '09/11/2025', description: 'ST ANTHONY PARK DENTAL', address: '2278 COMO AVE', amount: 734.50, category: 'Healthcare', merchant: 'ST ANTHONY PARK DENTAL', source: 'Apple Card - September 2025' },
  { date: '09/11/2025', description: 'APPLE.COM/BILL', address: 'CUPERTINO', amount: 15.25, category: 'Subscriptions', merchant: 'APPLE.COM/BILL', source: 'Apple Card - September 2025' },
  { date: '09/13/2025', description: 'CUB FOODS', address: '1104 LAGOON AVE', amount: 46.43, category: 'Groceries', merchant: 'CUB FOODS', source: 'Apple Card - September 2025' },
  { date: '09/21/2025', description: 'ALDI', address: '2601 LYNDALE AVE', amount: 105.80, category: 'Groceries', merchant: 'ALDI', source: 'Apple Card - September 2025' },
  { date: '09/22/2025', description: 'DD *DOORDASH', address: '303 2ND STREET', amount: 47.58, category: 'Dining', merchant: 'DD *DOORDASH', source: 'Apple Card - September 2025' },
  { date: '09/28/2025', description: 'OPENAI *CHATGPT', address: 'SAN FRANCISCO', amount: 20.00, category: 'Subscriptions', merchant: 'OPENAI *CHATGPT', source: 'Apple Card - September 2025' }
].map((t) => ({
  ...t,
  id: generateId(t.date, t.merchant, t.address, t.amount)
}));

export const useTransactionData = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(startData);
  const [categoryRules, setCategoryRules] = useState<Record<string, string>>(makeRules(startData));
  const [statements] = useState<Statement[]>([
    { institution: 'Apple Card', month: 'September 2025', uploadDate: '2025-10-21', transactionCount: startData.length }
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categoryData = useMemo((): CategoryData[] => {
    const grouped: Record<string, number> = transactions.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped).map((entry) => ({
      name: entry[0],
      value: parseFloat(entry[1].toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const totalSpending = useMemo(() => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'all') return transactions;
    return transactions.filter((t) => t.category === selectedCategory);
  }, [transactions, selectedCategory]);

  const updateTransactionCategory = (transaction: Transaction, newCategory: string) => {
    const updated = transactions.map((t) => {
      if (t.merchant === transaction.merchant) {
        return { ...t, category: newCategory };
      }
      return t;
    });
    setTransactions(updated);
    
    setCategoryRules((prev) => ({
      ...prev,
      [transaction.merchant]: newCategory
    }));
  };

  const importCategoryRules = (rules: Record<string, string>) => {
    setCategoryRules(rules);
    const updated = transactions.map((t) => ({
      ...t,
      category: rules[t.merchant] || t.category
    }));
    setTransactions(updated);
  };

  return {
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
  };
};
