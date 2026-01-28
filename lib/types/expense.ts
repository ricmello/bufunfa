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
  // Recurring expense fields (future-proof)
  userId?: string; // Auth0 user.sub
  recurringExpenseId?: string; // Link to recurring template
  isForecast?: boolean; // Default: false (undefined = false)
  forecastDate?: Date; // Original scheduled date
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

// Expense query and filtering types
export interface ExpenseFilters {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  subcategoryId?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  type?: 'expense' | 'credit' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
  includeForecast?: boolean; // Include forecast expenses (default: true)
  forecastOnly?: boolean; // Show only forecasts (default: false)
}

export interface ExpenseWithCategory extends Expense {
  categoryName: string;
  categoryColor: string;
  categoryIcon?: string;
  subcategoryName: string;
}

export interface PaginatedExpenses {
  expenses: ExpenseWithCategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  subcategoryId: string;
  merchantName: string | null;
  notes: string | null;
}
