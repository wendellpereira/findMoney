export interface Transaction {
  id: string;
  date: string;
  description: string;
  address: string;
  amount: number;
  category: string;
  category_color?: string;
  merchant: string;
  source?: string;
}

export interface Statement {
  id: number;
  institution: string;
  month: string;
  upload_date: string;
  transaction_count: number;
  actual_transaction_count?: number;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  color?: string;
  created_at: string;
}

export interface CategoryData {
  name: string;
  color?: string;
  value: number;
  transaction_count?: number;
}

export interface MerchantRule {
  id: number;
  merchant_name: string;
  category_name: string;
  category_color?: string;
  auto_apply: boolean;
  created_at: string;
}

export interface ExportData {
  version: string;
  exportDate: string;
  categoryRules: Record<string, string>;
  transactions: Transaction[];
  statements: Statement[];
}
