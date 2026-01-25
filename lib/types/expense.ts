export interface Expense {
  _id?: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string; // ObjectId reference to category
  subcategoryId: string; // ObjectId reference to subcategory within category
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
  category: string; // Main category name (e.g., "Food & Groceries")
  subcategory: string; // Subcategory name (e.g., "Restaurant")
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
