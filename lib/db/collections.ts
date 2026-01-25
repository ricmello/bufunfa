import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';
import { Expense } from '../types/expense';

export async function getExpensesCollection(): Promise<Collection<Expense>> {
  const db = await getDatabase();
  return db.collection<Expense>('expenses');
}

export async function ensureIndexes(): Promise<void> {
  const expenses = await getExpensesCollection();

  // Create indexes for common queries
  await expenses.createIndex({ statementYear: 1, statementMonth: 1 });
  await expenses.createIndex({ date: -1 });
  await expenses.createIndex({ categoryId: 1, subcategoryId: 1, statementYear: 1, statementMonth: 1 });

  console.log('✅ Database indexes created successfully');
}

// Helper to convert string ID to ObjectId
export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}
