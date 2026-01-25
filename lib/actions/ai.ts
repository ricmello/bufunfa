'use server';

import { categorizeExpense, categorizeExpenses } from '../ai/categorize';
import { AICategorizationResult } from '../types/expense';

export async function categorizeExpenseAction(
  description: string,
  amount: number
): Promise<AICategorizationResult> {
  return categorizeExpense(description, amount);
}

export async function categorizeExpensesAction(
  expenses: Array<{ description: string; amount: number }>
): Promise<AICategorizationResult[]> {
  return categorizeExpenses(expenses);
}
