'use server';

import { ObjectId } from 'mongodb';
import { auth0 } from '@/lib/auth0';
import { getExpensesCollection } from '@/lib/db/collections';
import type { ExpenseFormData } from '@/lib/types/expense';

/**
 * Update a single forecast occurrence
 * Only works on forecast expenses (isForecast: true)
 */
export async function updateForecastOccurrence(
  id: string,
  data: Partial<ExpenseFormData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getExpensesCollection();

    // Check if this is a forecast
    const expense = await collection.findOne({ _id: new ObjectId(id) } as any);
    if (!expense?.isForecast) {
      return { success: false, error: 'Can only update forecast expenses' };
    }

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (data.description !== undefined) updateDoc.description = data.description;
    if (data.amount !== undefined) updateDoc.amount = data.amount;
    if (data.categoryId !== undefined) updateDoc.categoryId = data.categoryId;
    if (data.subcategoryId !== undefined) updateDoc.subcategoryId = data.subcategoryId;
    if (data.merchantName !== undefined) updateDoc.merchantName = data.merchantName;

    await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      { $set: updateDoc }
    );

    return { success: true };
  } catch (error) {
    console.error('Error updating forecast occurrence:', error);
    return { success: false, error: 'Failed to update forecast' };
  }
}

/**
 * Update all future forecast occurrences from a recurring template
 * Updates all forecasts with forecastDate >= fromDate
 */
export async function updateAllFutureForecasts(
  recurringExpenseId: string,
  fromDate: Date,
  data: Partial<ExpenseFormData>
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getExpensesCollection();

    const updateDoc: any = {
      updatedAt: new Date(),
    };

    if (data.description !== undefined) updateDoc.description = data.description;
    if (data.amount !== undefined) updateDoc.amount = data.amount;
    if (data.categoryId !== undefined) updateDoc.categoryId = data.categoryId;
    if (data.subcategoryId !== undefined) updateDoc.subcategoryId = data.subcategoryId;
    if (data.merchantName !== undefined) updateDoc.merchantName = data.merchantName;

    const result = await collection.updateMany(
      {
        recurringExpenseId,
        isForecast: true,
        forecastDate: { $gte: new Date(fromDate) },
      } as any,
      { $set: updateDoc }
    );

    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Error updating future forecasts:', error);
    return { success: false, error: 'Failed to update future forecasts' };
  }
}

/**
 * Bulk delete forecast expenses
 * Only deletes forecasts (isForecast: true)
 */
export async function bulkDeleteForecasts(
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getExpensesCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.deleteMany({
      _id: { $in: objectIds },
      isForecast: true,
    } as any);

    return { success: true, count: result.deletedCount };
  } catch (error) {
    console.error('Error deleting forecasts:', error);
    return { success: false, error: 'Failed to delete forecasts' };
  }
}

/**
 * Manually convert a forecast to a real expense
 * Sets isForecast: false
 */
export async function confirmForecast(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getExpensesCollection();

    const result = await collection.updateOne(
      { _id: new ObjectId(id), isForecast: true } as any,
      { $set: { isForecast: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Forecast not found or already confirmed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error confirming forecast:', error);
    return { success: false, error: 'Failed to confirm forecast' };
  }
}

/**
 * Bulk confirm multiple forecasts
 * Converts multiple forecasts to real expenses
 */
export async function bulkConfirmForecasts(
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const collection = await getExpensesCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.updateMany(
      {
        _id: { $in: objectIds },
        isForecast: true,
      } as any,
      { $set: { isForecast: false, updatedAt: new Date() } }
    );

    return { success: true, count: result.modifiedCount };
  } catch (error) {
    console.error('Error confirming forecasts:', error);
    return { success: false, error: 'Failed to confirm forecasts' };
  }
}
