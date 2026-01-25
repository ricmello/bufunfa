export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  categoryConfidence: number;
  merchantName: string | null;
  statementMonth: number;
  statementYear: number;
  rawCsvRow: string;
  createdAt: Date;
  updatedAt: Date;
  aiInsights: {
    isRecurring: boolean;
    suggestedBudgetCategory: string;
    notes: string | null;
    installment?: {
      current: number;
      total: number;
      baseDescription: string;
    };
  };
}

export interface ExpenseInsert extends Omit<Expense, '_id' | 'createdAt' | 'updatedAt'> {
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AICategorizationResult {
  category: string;
  confidence: number;
  merchantName: string | null;
  isRecurring: boolean;
  suggestedBudgetCategory: string;
  notes: string | null;
}

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Other'
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
