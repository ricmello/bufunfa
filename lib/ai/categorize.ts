import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { groq, CATEGORIZATION_MODEL } from './groq-client';
import { getCategorizationPrompt, getBatchCategorizationPrompt } from './prompts';
import { AICategorizationResult } from '../types/expense';
import { getCategoryNames } from '../actions/categories';
import { parseWithRetry } from './json-parser';

// Dynamic schema that uses categories from database
async function getCategorizationSchema(): Promise<z.ZodObject<any>> {
  const categoryNames = await getCategoryNames();

  return z.object({
    category: z.enum(categoryNames as [string, ...string[]]),
    subcategory: z.string(), // Validated against category's subcategories in import action
    confidence: z.number().min(0).max(1),
    merchantName: z.string().nullable(),
    isRecurring: z.boolean(),
    suggestedBudgetCategory: z.string(),
    notes: z.string().nullable(),
  });
}

async function getBatchCategorizationSchema(): Promise<z.ZodObject<any>> {
  const CategorizationSchema = await getCategorizationSchema();

  return z.object({
    results: z.array(CategorizationSchema),
  });
}

export async function categorizeExpense(
  description: string,
  amount: number
): Promise<AICategorizationResult> {
  try {
    const prompt = await getCategorizationPrompt(description, amount);
    const schema = await getCategorizationSchema();

    const { object } = await generateObject({
      model: groq(CATEGORIZATION_MODEL),
      schema,
      prompt,
      temperature: 0.3,
    });

    return object as any;
  } catch (error) {
    console.error('Error categorizing expense:', error);

    // Fallback to "Other" → "Uncategorized" if AI fails
    return {
      category: 'Other',
      subcategory: 'Uncategorized',
      confidence: 0,
      merchantName: null,
      isRecurring: false,
      suggestedBudgetCategory: 'Uncategorized',
      notes: 'Failed to categorize with AI',
    };
  }
}

// Enhanced categorization with retry logic
export async function categorizeExpenseWithRetry(
  description: string,
  amount: number
): Promise<AICategorizationResult> {
  try {
    // First attempt: use generateObject
    return await categorizeExpense(description, amount);
  } catch (error) {
    // Fallback: use generateText and parse manually with retry
    try {
      const prompt = await getCategorizationPrompt(description, amount);
      const schema = await getCategorizationSchema();

      const { text } = await generateText({
        model: groq(CATEGORIZATION_MODEL),
        prompt: prompt + '\n\nRETURN ONLY VALID JSON, NO MARKDOWN.',
        temperature: 0.3,
      });

      const parseResult = await parseWithRetry(
        text,
        schema,
        (errorJson, attempt) =>
          `Fix this invalid JSON to match the required schema.

Broken JSON:
${errorJson}

Required format: { category, subcategory, confidence, merchantName, isRecurring, suggestedBudgetCategory, notes }

Attempt ${attempt}/3. Return ONLY valid JSON, no markdown or explanations.`,
        3
      );

      if (!parseResult.success) {
        // Ultimate fallback
        return {
          category: 'Other',
          subcategory: 'Uncategorized',
          confidence: 0,
          merchantName: null,
          isRecurring: false,
          suggestedBudgetCategory: 'Uncategorized',
          notes: `Parsing failed after 3 retries: ${parseResult.error}`,
        };
      }

      return parseResult.data as any;
    } catch (retryError) {
      console.error('Error in retry logic:', retryError);
      return {
        category: 'Other',
        subcategory: 'Uncategorized',
        confidence: 0,
        merchantName: null,
        isRecurring: false,
        suggestedBudgetCategory: 'Uncategorized',
        notes: 'Failed to categorize with AI',
      };
    }
  }
}

// Helper function to chunk arrays
function chunkArray<T>(array: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
    array.slice(i * size, i * size + size)
  );
}

// Batch categorization with hybrid batching (batches of 10)
export async function categorizeBatchExpenses(
  expenses: Array<{ description: string; amount: number }>,
  batchSize: number = 10
): Promise<AICategorizationResult[]> {
  const results: AICategorizationResult[] = [];
  const batches = chunkArray(expenses, batchSize);

  console.log(`Processing ${expenses.length} expenses in ${batches.length} batches of ${batchSize}`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`Categorizing batch ${i + 1}/${batches.length}...`);

    try {
      const prompt = await getBatchCategorizationPrompt(batch);
      const schema = await getBatchCategorizationSchema();

      const { object } = await generateObject({
        model: groq(CATEGORIZATION_MODEL),
        schema,
        prompt,
        temperature: 0.3,
      });

      console.log(object);

      results.push(...(object as any).results);
    } catch (error) {
      console.error(`Error in batch ${i + 1}, falling back to one-by-one:`, error);

      // Fallback to one-by-one for this batch
      for (const expense of batch) {
        const result = await categorizeExpenseWithRetry(expense.description, expense.amount);
        results.push(result);
      }
    }

    // Delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

// Legacy function for backward compatibility
export async function categorizeExpenses(
  expenses: Array<{ description: string; amount: number }>
): Promise<AICategorizationResult[]> {
  return categorizeBatchExpenses(expenses, 10);
}
