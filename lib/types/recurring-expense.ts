/**
 * Recurring Expense Types
 * Templates for auto-generating forecast expenses
 */

export interface RecurringExpense {
  _id?: string;
  userId: string; // Auth0 user.sub (future-proof)
  description: string;
  amount: number;
  categoryId: string;
  subcategoryId: string;
  frequency: 'monthly' | 'weekly';
  startDate: Date;
  endDate?: Date; // Optional stop date
  dayOfMonth?: number; // 1-31 for monthly
  dayOfWeek?: number; // 0-6 for weekly (0 = Sunday)
  forecastMonths: number; // Default: 6
  merchantName?: string | null;
  tags: string[];
  isActive: boolean; // Soft delete
  createdAt: Date;
  updatedAt: Date;
}

export interface RecurringExpenseFormData {
  description: string;
  amount: number;
  categoryId: string;
  subcategoryId: string;
  frequency: 'monthly' | 'weekly';
  startDate: Date;
  endDate?: Date;
  dayOfMonth?: number;
  dayOfWeek?: number;
  forecastMonths: number;
  merchantName?: string;
  tags: string[];
}

export interface RecurringExpenseWithCategory extends RecurringExpense {
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  subcategoryName: string;
}
