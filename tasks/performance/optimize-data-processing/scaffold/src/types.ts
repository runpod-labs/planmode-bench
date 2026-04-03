export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  date: string;
  description: string;
}

export interface CategoryGroup {
  category: string;
  transactions: Transaction[];
  total: number;
}

export interface DuplicateGroup {
  key: string;
  transactions: Transaction[];
}

export interface RunningBalanceEntry {
  transactionId: string;
  amount: number;
  balance: number;
  date: string;
}

export interface SpenderSummary {
  userId: string;
  totalSpent: number;
  transactionCount: number;
}

export interface PipelineResult {
  categoryGroups: CategoryGroup[];
  duplicates: DuplicateGroup[];
  topSpenders: SpenderSummary[];
}
