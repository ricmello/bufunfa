'use server';

import { getExpensesCollection } from '../db/collections';
import { Expense } from '../types/expense';
import { ObjectId } from 'mongodb';

export interface RecentExpense {
  _id: string;
  description: string;
  amount: number;
  date: Date;
  categoryName: string;
  subcategoryName: string;
  merchantName: string | null;
}

export interface TopExpense {
  _id: string;
  description: string;
  amount: number;
  categoryName: string;
  subcategoryName: string;
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

    const result = await collection
      .aggregate([
        {
          $match: { date: { $gte: cutoffDate } },
        },
        {
          $sort: { date: -1 },
        },
        {
          $limit: 50,
        },
        {
          $lookup: {
            from: 'categories',
            let: { catId: { $toObjectId: '$categoryId' }, subId: '$subcategoryId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$catId'] },
                },
              },
              {
                $project: {
                  name: 1,
                  subcategory: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$subcategories',
                          as: 'sub',
                          cond: { $eq: ['$$sub._id', '$$subId'] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
            as: 'categoryData',
          },
        },
        {
          $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true },
        },
      ])
      .toArray();

    return result.map((expense: any) => ({
      _id: expense._id.toString(),
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      categoryName: expense.categoryData?.name || 'Unknown',
      subcategoryName: expense.categoryData?.subcategory?.name || 'Unknown',
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

    const matchQuery: any = { amount: { $lt: 0 } }; // Only expenses (negative amounts)

    if (month !== undefined && year !== undefined) {
      matchQuery.statementMonth = month;
      matchQuery.statementYear = year;
    }

    const result = await collection
      .aggregate([
        {
          $match: matchQuery,
        },
        {
          $sort: { amount: 1 }, // Sort by amount ascending (most negative first)
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: 'categories',
            let: { catId: { $toObjectId: '$categoryId' }, subId: '$subcategoryId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$catId'] },
                },
              },
              {
                $project: {
                  name: 1,
                  subcategory: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$subcategories',
                          as: 'sub',
                          cond: { $eq: ['$$sub._id', '$$subId'] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            ],
            as: 'categoryData',
          },
        },
        {
          $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true },
        },
      ])
      .toArray();

    return result.map((expense: any) => ({
      _id: expense._id.toString(),
      description: expense.description,
      amount: Math.abs(expense.amount),
      categoryName: expense.categoryData?.name || 'Unknown',
      subcategoryName: expense.categoryData?.subcategory?.name || 'Unknown',
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

    console.log('Monthly trends aggregation result:', JSON.stringify(result, null, 2));

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const trends = result.map((item: any) => ({
      month: monthNames[item._id.month - 1],
      year: item._id.year,
      totalExpenses: item.totalExpenses,
      totalCredits: item.totalCredits,
      netAmount: item.totalCredits - item.totalExpenses,
    })).reverse(); // Reverse to show oldest to newest

    console.log('Formatted trends:', trends);

    return trends;
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    return [];
  }
}

export async function getCategoryBreakdown(
  month?: number,
  year?: number
): Promise<Array<{ categoryId: string; categoryName: string; total: number; count: number }>> {
  try {
    const collection = await getExpensesCollection();

    const matchQuery: any = { amount: { $lt: 0 } };

    if (month !== undefined && year !== undefined) {
      matchQuery.statementMonth = month;
      matchQuery.statementYear = year;
    }

    const result = await collection
      .aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: '$categoryId',
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            let: { catId: { $toObjectId: '$_id' } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$_id', '$$catId'] },
                },
              },
              {
                $project: {
                  name: 1,
                },
              },
            ],
            as: 'categoryData',
          },
        },
        {
          $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true },
        },
        {
          $sort: { total: -1 },
        },
      ])
      .toArray();

    return result.map((item: any) => ({
      categoryId: item._id,
      categoryName: item.categoryData?.name || 'Unknown',
      total: item.total,
      count: item.count,
    }));
  } catch (error) {
    console.error('Error fetching category breakdown:', error);
    return [];
  }
}
