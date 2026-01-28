import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { Expense } from '../types/expense';
import type { SplitEvent } from '../types/split-event';
import type { Receipt } from '../types/receipt';
import type { RecurringExpense } from '../types/recurring-expense';

export async function getExpensesCollection(): Promise<Collection<Expense>> {
  const db = await getDatabase();
  return db.collection<Expense>('expenses');
}

export async function getEventsCollection(): Promise<Collection<SplitEvent>> {
  const db = await getDatabase();
  return db.collection<SplitEvent>('split_events');
}

export async function getReceiptsCollection(): Promise<Collection<Receipt>> {
  const db = await getDatabase();
  return db.collection<Receipt>('split_receipts');
}

export async function getRecurringExpensesCollection(): Promise<Collection<RecurringExpense>> {
  const db = await getDatabase();
  return db.collection<RecurringExpense>('recurring_expenses');
}

export async function ensureIndexes(): Promise<void> {
  const expenses = await getExpensesCollection();

  // Create indexes for common queries
  await expenses.createIndex({ statementYear: 1, statementMonth: 1 });
  await expenses.createIndex({ date: -1 });
  await expenses.createIndex({ categoryId: 1, subcategoryId: 1, statementYear: 1, statementMonth: 1 });

  // Recurring expense indexes
  await expenses.createIndex({ isForecast: 1, forecastDate: 1 });
  await expenses.createIndex({ recurringExpenseId: 1, forecastDate: 1 });
  await expenses.createIndex({ userId: 1, isForecast: 1 });

  // Split events indexes
  const events = await getEventsCollection();
  await events.createIndex({ hostUserId: 1, eventDate: -1 });
  await events.createIndex({ eventDate: -1 });
  await events.createIndex({ status: 1, eventDate: -1 });

  // Split receipts indexes
  const receipts = await getReceiptsCollection();
  await receipts.createIndex({ eventId: 1, createdAt: -1 });

  // Recurring expenses indexes
  const recurringExpenses = await getRecurringExpensesCollection();
  await recurringExpenses.createIndex({ userId: 1, isActive: 1 });
  await recurringExpenses.createIndex({ isActive: 1, startDate: 1 });

  console.log('✅ Database indexes created successfully');
}

// Helper to convert string ID to ObjectId
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}
