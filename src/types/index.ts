export interface Transaction {
  id: string;
  date: string;
  description: string;
  address: string;
  amount: number;
  category: string;
  merchant: string;
  source: string;
}

export interface Statement {
  institution: string;
  month: string;
  uploadDate: string;
  transactionCount: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface ExportData {
  version: string;
  exportDate: string;
  categoryRules: Record<string, string>;
  transactions: Transaction[];
  statements: Statement[];
}
