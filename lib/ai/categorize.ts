import { generateObject } from 'ai';
import { z } from 'zod';
import { groq, CATEGORIZATION_MODEL } from './groq-client';
import { getCategorizationPrompt } from './prompts';
import { AICategorizationResult, EXPENSE_CATEGORIES } from '../types/expense';

const CategorizationSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  confidence: z.number().min(0).max(1),
  merchantName: z.string().nullable(),
  isRecurring: z.boolean(),
  suggestedBudgetCategory: z.string(),
  notes: z.string().nullable(),
});

export async function categorizeExpense(
  description: string,
  amount: number
): Promise<AICategorizationResult> {
  try {
    const prompt = getCategorizationPrompt(description, amount);

    const { object } = await generateObject({
      model: groq(CATEGORIZATION_MODEL),
      schema: CategorizationSchema,
      prompt,
      temperature: 0.3, // Lower temperature for more consistent categorization
    });

    return object;
  } catch (error) {
    console.error('Error categorizing expense:', error);

    // Fallback to "Other" category if AI fails
    return {
      category: 'Other',
      confidence: 0,
      merchantName: null,
      isRecurring: false,
      suggestedBudgetCategory: 'Uncategorized',
      notes: 'Failed to categorize with AI',
    };
  }
}

// Batch categorization for CSV imports (processes multiple expenses)
export async function categorizeExpenses(
  expenses: Array<{ description: string; amount: number }>
): Promise<AICategorizationResult[]> {
  const results: AICategorizationResult[] = [];

  for (const expense of expenses) {
    const result = await categorizeExpense(expense.description, expense.amount);
    results.push(result);

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}
