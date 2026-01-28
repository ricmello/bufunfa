'use server';

import { ObjectId } from 'mongodb';
import { auth0 } from '@/lib/auth0';
import { getRecurringExpensesCollection, getExpensesCollection } from '@/lib/db/collections';
import { generateForecastDates } from '@/lib/utils/date-calculations';
import type { RecurringExpense, RecurringExpenseFormData, RecurringExpenseWithCategory } from '@/lib/types/recurring-expense';

/**
 * Create a new recurring expense template and generate initial forecasts
 */
export async function createRecurringExpense(
  data: RecurringExpenseFormData
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate frequency-specific fields
    if (data.frequency === 'monthly' && !data.dayOfMonth) {
      return { success: false, error: 'Day of month required for monthly recurring' };
    }
    if (data.frequency === 'weekly' && data.dayOfWeek === undefined) {
      return { success: false, error: 'Day of week required for weekly recurring' };
    }

    const collection = await getRecurringExpensesCollection();

    const template: Omit<RecurringExpense, '_id'> = {
      userId: session.user.sub,
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      frequency: data.frequency,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      dayOfMonth: data.dayOfMonth,
      dayOfWeek: data.dayOfWeek,
      forecastMonths: data.forecastMonths,
      merchantName: data.merchantName || null,
      tags: data.tags,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(template as any);
    const templateId = result.insertedId.toString();

    // Generate initial forecasts
    const templateWithId: RecurringExpense = {
      ...template,
      _id: templateId,
    };

    const forecasts = generateForecastDates(templateWithId);

    if (forecasts.length > 0) {
      const expensesCollection = await getExpensesCollection();
      await expensesCollection.insertMany(forecasts as any);
    }

    return { success: true, id: templateId };
  } catch (error) {
    console.error('Error creating recurring expense:', error);
    return { success: false, error: 'Failed to create recurring expense' };
  }
}

/**
 * Update a recurring expense template
 * NOTE: Does not regenerate forecasts - user may have edited them
 */
export async function updateRecurringExpense(
  id: string,
  data: Partial<RecurringExpenseFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getRecurringExpensesCollection();

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (data.description !== undefined) updateDoc.description = data.description;
    if (data.amount !== undefined) updateDoc.amount = data.amount;
    if (data.categoryId !== undefined) updateDoc.categoryId = data.categoryId;
    if (data.subcategoryId !== undefined) updateDoc.subcategoryId = data.subcategoryId;
    if (data.frequency !== undefined) updateDoc.frequency = data.frequency;
    if (data.startDate !== undefined) updateDoc.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateDoc.endDate = data.endDate ? new Date(data.endDate) : undefined;
    if (data.dayOfMonth !== undefined) updateDoc.dayOfMonth = data.dayOfMonth;
    if (data.dayOfWeek !== undefined) updateDoc.dayOfWeek = data.dayOfWeek;
    if (data.forecastMonths !== undefined) updateDoc.forecastMonths = data.forecastMonths;
    if (data.merchantName !== undefined) updateDoc.merchantName = data.merchantName || null;
    if (data.tags !== undefined) updateDoc.tags = data.tags;

    await collection.updateOne(
      { _id: new ObjectId(id), userId: session.user.sub } as any,
      { $set: updateDoc }
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating recurring expense:', error);
    return { success: false, error: 'Failed to update recurring expense' };
  }
}

/**
 * Stop a recurring expense (soft delete)
 * Deletes future forecasts but keeps past forecasts and real expenses
 */
export async function stopRecurringExpense(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getRecurringExpensesCollection();

    // Set template as inactive
    await collection.updateOne(
      { _id: new ObjectId(id), userId: session.user.sub } as any,
      { $set: { isActive: false, updatedAt: new Date() } }
    );

    // Delete future forecasts (keep past ones)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const expensesCollection = await getExpensesCollection();
    await expensesCollection.deleteMany({
      recurringExpenseId: id,
      isForecast: true,
      forecastDate: { $gt: today },
    } as any);

    return { success: true };
  } catch (error) {
    console.error('Error stopping recurring expense:', error);
    return { success: false, error: 'Failed to stop recurring expense' };
  }
}

/**
 * Delete a recurring expense permanently
 * Deletes all associated forecasts
 */
export async function deleteRecurringExpense(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getRecurringExpensesCollection();

    // Delete template
    await collection.deleteOne({
      _id: new ObjectId(id),
      userId: session.user.sub,
    } as any);

    // Delete all forecasts (past and future)
    const expensesCollection = await getExpensesCollection();
    await expensesCollection.deleteMany({
      recurringExpenseId: id,
      isForecast: true,
    } as any);

    return { success: true };
  } catch (error) {
    console.error('Error deleting recurring expense:', error);
    return { success: false, error: 'Failed to delete recurring expense' };
  }
}

/**
 * Get all active recurring expense templates with category info
 */
export async function getRecurringExpenses(): Promise<RecurringExpenseWithCategory[]> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return [];
    }

    const collection = await getRecurringExpensesCollection();

    const templates = await collection
      .aggregate([
        {
          $match: {
            userId: session.user.sub,
            isActive: true,
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
            userId: 1,
            description: 1,
            amount: 1,
            categoryId: 1,
            subcategoryId: 1,
            frequency: 1,
            startDate: 1,
            endDate: 1,
            dayOfMonth: 1,
            dayOfWeek: 1,
            forecastMonths: 1,
            merchantName: 1,
            tags: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            categoryName: '$category.name',
            categoryColor: '$category.color',
            categoryIcon: '$category.icon',
            subcategoryName: '$subcategory.name',
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .toArray();

    return templates.map((t) => ({
      ...t,
      _id: t._id.toString(),
      categoryId: t.categoryId.toString(),
    }));
  } catch (error) {
    console.error('Error fetching recurring expenses:', error);
    return [];
  }
}

/**
 * Get a single recurring expense by ID
 */
export async function getRecurringExpense(
  id: string
): Promise<RecurringExpenseWithCategory | null> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return null;
    }

    const collection = await getRecurringExpensesCollection();

    const templates = await collection
      .aggregate([
        {
          $match: {
            _id: new ObjectId(id),
            userId: session.user.sub,
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
            userId: 1,
            description: 1,
            amount: 1,
            categoryId: 1,
            subcategoryId: 1,
            frequency: 1,
            startDate: 1,
            endDate: 1,
            dayOfMonth: 1,
            dayOfWeek: 1,
            forecastMonths: 1,
            merchantName: 1,
            tags: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            categoryName: '$category.name',
            categoryColor: '$category.color',
            categoryIcon: '$category.icon',
            subcategoryName: '$subcategory.name',
          },
        },
      ])
      .toArray();

    if (templates.length === 0) return null;

    const template = templates[0];
    return {
      ...template,
      _id: template._id.toString(),
      categoryId: template.categoryId.toString(),
    };
  } catch (error) {
    console.error('Error fetching recurring expense:', error);
    return null;
  }
}
