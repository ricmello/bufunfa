'use server';

import { getExpensesCollection } from '../db/collections';
import { Expense } from '../types/expense';

export interface RecentExpense {
  _id: string;
  description: string;
  amount: number;
  date: Date;
  category: string;
  merchantName: string | null;
}

export interface TopExpense {
  _id: string;
  description: string;
  amount: number;
  category: string;
  merchantName: string | null;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  totalExpenses: number;
  totalCredits: number;
  netAmount: number;
}

export async function getRecentExpenses(days: number = 7): Promise<RecentExpense[]> {
  try {
    const collection = await getExpensesCollection();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const expenses = await collection
      .find({ date: { $gte: cutoffDate } })
      .sort({ date: -1 })
      .limit(50)
      .toArray();

    return expenses.map((expense) => ({
      _id: expense._id!.toString(),
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      category: expense.category,
      merchantName: expense.merchantName,
    }));
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    return [];
  }
}

export async function getTopExpenses(
  limit: number = 10,
  month?: number,
  year?: number
): Promise<TopExpense[]> {
  try {
    const collection = await getExpensesCollection();

    const query: any = { amount: { $lt: 0 } }; // Only expenses (negative amounts)

    if (month !== undefined && year !== undefined) {
      query.statementMonth = month;
      query.statementYear = year;
    }

    const expenses = await collection
      .find(query)
      .sort({ amount: 1 }) // Sort by amount ascending (most negative first)
      .limit(limit)
      .toArray();

    return expenses.map((expense) => ({
      _id: expense._id!.toString(),
      description: expense.description,
      amount: Math.abs(expense.amount),
      category: expense.category,
      merchantName: expense.merchantName,
    }));
  } catch (error) {
    console.error('Error fetching top expenses:', error);
    return [];
  }
}

export async function getMonthlyTrends(months: number = 6): Promise<MonthlyTrend[]> {
  try {
    const collection = await getExpensesCollection();

    const result = await collection
      .aggregate([
        {
          $group: {
            _id: {
              year: '$statementYear',
              month: '$statementMonth',
            },
            totalExpenses: {
              $sum: {
                $cond: [{ $lt: ['$amount', 0] }, { $abs: '$amount' }, 0],
              },
            },
            totalCredits: {
              $sum: {
                $cond: [{ $gt: ['$amount', 0] }, '$amount', 0],
              },
            },
          },
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 },
        },
        {
          $limit: months,
        },
      ])
      .toArray();

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return result.map((item: any) => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      totalExpenses: item.totalExpenses,
      totalCredits: item.totalCredits,
      netAmount: item.totalCredits - item.totalExpenses,
    })).reverse(); // Reverse to show oldest to newest
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    return [];
  }
}

export async function getCategoryBreakdown(
  month?: number,
  year?: number
): Promise<Array<{ category: string; total: number; count: number }>> {
  try {
    const collection = await getExpensesCollection();

    const query: any = { amount: { $lt: 0 } };

    if (month !== undefined && year !== undefined) {
      query.statementMonth = month;
      query.statementYear = year;
    }

    const result = await collection
      .aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { total: -1 },
        },
      ])
      .toArray();

    return result.map((item: any) => ({
      category: item._id,
      total: item.total,
      count: item.count,
    }));
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return [];
  }
}
