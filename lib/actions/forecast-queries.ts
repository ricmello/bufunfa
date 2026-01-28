'use server';

import { auth0 } from '@/lib/auth0';
import { getExpensesCollection } from '@/lib/db/collections';
import type { ExpenseWithCategory, Expense } from '@/lib/types/expense';

/**
 * Get upcoming forecast expenses within a specified number of days
 */
export async function getUpcomingForecasts(
  days: number = 30
): Promise<ExpenseWithCategory[]> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return [];
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const collection = await getExpensesCollection();

    const forecasts = await collection
      .aggregate([
        {
          $match: {
            isForecast: true,
            forecastDate: {
              $gte: today,
              $lte: endDate,
            },
          },
        },
        {
          $addFields: {
            categoryObjectId: { $toObjectId: '$categoryId' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryObjectId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category',
        },
        {
          $addFields: {
            subcategory: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$category.subcategories',
                    as: 'sub',
                    cond: { $eq: ['$$sub._id', '$subcategoryId'] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            description: 1,
            amount: 1,
            date: 1,
            categoryId: 1,
            subcategoryId: 1,
            categoryConfidence: 1,
            merchantName: 1,
            statementMonth: 1,
            statementYear: 1,
            rawCsvRow: 1,
            createdAt: 1,
            updatedAt: 1,
            aiInsights: 1,
            userId: 1,
            recurringExpenseId: 1,
            isForecast: 1,
            forecastDate: 1,
            categoryName: '$category.name',
            categoryColor: '$category.color',
            categoryIcon: '$category.icon',
            subcategoryName: '$subcategory.name',
          },
        },
        {
          $sort: { forecastDate: 1 },
        },
      ])
      .toArray();

    return forecasts.map((f) => ({
      ...f,
      _id: f._id.toString(),
      categoryId: f.categoryId.toString(),
    }));
  } catch (error) {
    console.error('Error fetching upcoming forecasts:', error);
    return [];
  }
}

/**
 * Find forecasts that potentially match an imported expense
 * Used during CSV import to suggest merging
 */
export async function findMatchingForecasts(
  expense: Partial<Expense>
): Promise<ExpenseWithCategory[]> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return [];
    }

    if (!expense.date || !expense.amount) {
      return [];
    }

    const collection = await getExpensesCollection();

    // Match criteria:
    // - isForecast: true
    // - forecastDate within ±1 day of expense.date
    // - amount within ±10% of expense.amount
    const expenseDate = new Date(expense.date);
    const oneDayBefore = new Date(expenseDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    const oneDayAfter = new Date(expenseDate);
    oneDayAfter.setDate(oneDayAfter.getDate() + 1);

    const amountMin = Math.abs(expense.amount) * 0.9;
    const amountMax = Math.abs(expense.amount) * 1.1;

    const matches = await collection
      .aggregate([
        {
          $match: {
            isForecast: true,
            forecastDate: {
              $gte: oneDayBefore,
              $lte: oneDayAfter,
            },
            $expr: {
              $and: [
                { $gte: [{ $abs: '$amount' }, amountMin] },
                { $lte: [{ $abs: '$amount' }, amountMax] },
              ],
            },
          },
        },
        {
          $addFields: {
            categoryObjectId: { $toObjectId: '$categoryId' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryObjectId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category',
        },
        {
          $addFields: {
            subcategory: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$category.subcategories',
                    as: 'sub',
                    cond: { $eq: ['$$sub._id', '$subcategoryId'] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            description: 1,
            amount: 1,
            date: 1,
            categoryId: 1,
            subcategoryId: 1,
            categoryConfidence: 1,
            merchantName: 1,
            statementMonth: 1,
            statementYear: 1,
            rawCsvRow: 1,
            createdAt: 1,
            updatedAt: 1,
            aiInsights: 1,
            userId: 1,
            recurringExpenseId: 1,
            isForecast: 1,
            forecastDate: 1,
            categoryName: '$category.name',
            categoryColor: '$category.color',
            categoryIcon: '$category.icon',
            subcategoryName: '$subcategory.name',
          },
        },
        {
          $limit: 5, // Limit to 5 potential matches
        },
      ])
      .toArray();

    return matches.map((m) => ({
      ...m,
      _id: m._id.toString(),
      categoryId: m.categoryId.toString(),
    }));
  } catch (error) {
    console.error('Error finding matching forecasts:', error);
    return [];
  }
}

/**
 * Get all forecasts for a specific recurring expense template
 */
export async function getForecastsForRecurring(
  recurringExpenseId: string
): Promise<ExpenseWithCategory[]> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return [];
    }

    const collection = await getExpensesCollection();

    const forecasts = await collection
      .aggregate([
        {
          $match: {
            recurringExpenseId,
            isForecast: true,
          },
        },
        {
          $addFields: {
            categoryObjectId: { $toObjectId: '$categoryId' },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryObjectId',
            foreignField: '_id',
            as: 'category',
          },
        },
        {
          $unwind: '$category',
        },
        {
          $addFields: {
            subcategory: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$category.subcategories',
                    as: 'sub',
                    cond: { $eq: ['$$sub._id', '$subcategoryId'] },
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $project: {
            _id: 1,
            description: 1,
            amount: 1,
            date: 1,
            categoryId: 1,
            subcategoryId: 1,
            categoryConfidence: 1,
            merchantName: 1,
            statementMonth: 1,
            statementYear: 1,
            rawCsvRow: 1,
            createdAt: 1,
            updatedAt: 1,
            aiInsights: 1,
            userId: 1,
            recurringExpenseId: 1,
            isForecast: 1,
            forecastDate: 1,
            categoryName: '$category.name',
            categoryColor: '$category.color',
            categoryIcon: '$category.icon',
            subcategoryName: '$subcategory.name',
          },
        },
        {
          $sort: { forecastDate: 1 },
        },
      ])
      .toArray();

    return forecasts.map((f) => ({
      ...f,
      _id: f._id.toString(),
      categoryId: f.categoryId.toString(),
    }));
  } catch (error) {
    console.error('Error fetching forecasts for recurring:', error);
    return [];
  }
}
