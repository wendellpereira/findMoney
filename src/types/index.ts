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
  statement_id?: number;
}

export interface Statement {
  id: number;
  institution: string;
  month: string;
  upload_date: string;
  transaction_count: number;
  actual_transaction_count?: number;
  created_at: string;
  revision_number: number;
}

export interface CategoryData {
  name: string;
  value: number;
  transaction_count?: number;
}

export interface ExportData {
  version: string;
  exportDate: string;
  transactions: Transaction[];
  statements: Statement[];
}

export interface FilterState {
  years: number[]
  months: number[]
  statementIds: number[]
}