import type { ExpenseWithCategory } from '@/lib/actions/expense-mutations';

export interface ExpenseAnalytics {
  totalAmount: number;
  totalExpenses: number;
  averageExpense: number;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    categoryColor: string;
    total: number;
    count: number;
    percentage: number;
    subcategories: Array<{
      subcategoryId: string;
      subcategoryName: string;
      total: number;
      count: number;
      percentage: number;
    }>;
  }>;
  expenseBreakdown: {
    negativeTotal: number;
    negativeCount: number;
    positiveTotal: number;
    positiveCount: number;
  };
}

export function calculateExpenseAnalytics(
  expenses: ExpenseWithCategory[]
): ExpenseAnalytics {
  if (expenses.length === 0) {
    return {
      totalAmount: 0,
      totalExpenses: 0,
      averageExpense: 0,
      dateRange: {
        earliest: new Date(),
        latest: new Date(),
      },
      categoryBreakdown: [],
      expenseBreakdown: {
        negativeTotal: 0,
        negativeCount: 0,
        positiveTotal: 0,
        positiveCount: 0,
      },
    };
  }

  // Calculate totals and expense breakdown
  let totalAmount = 0;
  let negativeTotal = 0;
  let negativeCount = 0;
  let positiveTotal = 0;
  let positiveCount = 0;

  expenses.forEach((expense) => {
    const absAmount = Math.abs(expense.amount);
    totalAmount += absAmount;

    if (expense.amount < 0) {
      negativeTotal += absAmount;
      negativeCount++;
    } else {
      positiveTotal += absAmount;
      positiveCount++;
    }
  });

  // Calculate date range
  const dates = expenses.map((e) => new Date(e.date).getTime());
  const earliest = new Date(Math.min(...dates));
  const latest = new Date(Math.max(...dates));

  // Group by category and subcategory
  const categoryMap = new Map<
    string,
    {
      categoryId: string;
      categoryName: string;
      categoryColor: string;
      total: number;
      count: number;
      subcategories: Map<
        string,
        {
          subcategoryId: string;
          subcategoryName: string;
          total: number;
          count: number;
        }
      >;
    }
  >();

  expenses.forEach((expense) => {
    const absAmount = Math.abs(expense.amount);

    // Get or create category entry
    if (!categoryMap.has(expense.categoryId)) {
      categoryMap.set(expense.categoryId, {
        categoryId: expense.categoryId,
        categoryName: expense.categoryName,
        categoryColor: expense.categoryColor,
        total: 0,
        count: 0,
        subcategories: new Map(),
      });
    }

    const category = categoryMap.get(expense.categoryId)!;
    category.total += absAmount;
    category.count++;

    // Get or create subcategory entry
    if (!category.subcategories.has(expense.subcategoryId)) {
      category.subcategories.set(expense.subcategoryId, {
        subcategoryId: expense.subcategoryId,
        subcategoryName: expense.subcategoryName,
        total: 0,
        count: 0,
      });
    }

    const subcategory = category.subcategories.get(expense.subcategoryId)!;
    subcategory.total += absAmount;
    subcategory.count++;
  });

  // Convert to array and calculate percentages
  const categoryBreakdown = Array.from(categoryMap.values())
    .map((category) => ({
      categoryId: category.categoryId,
      categoryName: category.categoryName,
      categoryColor: category.categoryColor,
      total: category.total,
      count: category.count,
      percentage: (category.total / totalAmount) * 100,
      subcategories: Array.from(category.subcategories.values())
        .map((sub) => ({
          subcategoryId: sub.subcategoryId,
          subcategoryName: sub.subcategoryName,
          total: sub.total,
          count: sub.count,
          percentage: (sub.total / category.total) * 100,
        }))
        .sort((a, b) => b.total - a.total),
    }))
    .sort((a, b) => b.total - a.total);

  return {
    totalAmount,
    totalExpenses: expenses.length,
    averageExpense: totalAmount / expenses.length,
    dateRange: {
      earliest,
      latest,
    },
    categoryBreakdown,
    expenseBreakdown: {
      negativeTotal,
      negativeCount,
      positiveTotal,
      positiveCount,
    },
  };
}
