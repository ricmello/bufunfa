'use server';

import Papa from 'papaparse';
import { getExpensesCollection } from '../db/collections';
import { categorizeBatchExpenses } from '../ai/categorize';
import { Expense } from '../types/expense';
import { detectInstallment } from '../utils/installment-detector';
import { getAllCategories } from './categories';
import { Category } from '../types/category';

interface CSVRow {
  Date: string;
  Description: string;
  Amount: string;
}

export interface ParsedCSVData {
  rows: Array<{
    date: string;
    description: string;
    amount: number;
  }>;
  totalRows: number;
}

export async function parseCSV(fileContent: string): Promise<ParsedCSVData> {
  return new Promise((resolve, reject) => {
    Papa.parse<CSVRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normalize headers to match expected format (supports English and Portuguese)
        const normalized = header.trim().toLowerCase();

        // Date: date, data, fecha
        if (normalized.includes('date') || normalized === 'data' || normalized === 'fecha') {
          return 'Date';
        }

        // Description: description, merchant, lançamento, lancamento, descrição, descricao
        if (
          normalized.includes('description') ||
          normalized.includes('merchant') ||
          normalized === 'lançamento' ||
          normalized === 'lancamento' ||
          normalized.includes('descri')
        ) {
          return 'Description';
        }

        // Amount: amount, value, valor
        if (
          normalized.includes('amount') ||
          normalized.includes('value') ||
          normalized === 'valor'
        ) {
          return 'Amount';
        }

        return header;
      },
      complete: (results) => {
        try {
          const rows = results.data
            .filter((row) => row.Date && row.Description && row.Amount)
            .map((row) => ({
              date: row.Date.trim(),
              description: row.Description.trim(),
              amount: parseFloat(row.Amount.replace(/[^0-9.-]/g, '')),
            }))
            .filter((row) => !isNaN(row.amount));

          resolve({
            rows,
            totalRows: rows.length,
          });
        } catch (error) {
          reject(new Error('Failed to parse CSV data'));
        }
      },
      error: (error: Error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Helper function to resolve category and subcategory names to ObjectIds
 * Returns both IDs with fallback to "Other" → "Uncategorized"
 */
function resolveCategoryIds(
  categoryName: string,
  subcategoryName: string,
  categories: Category[]
): { categoryId: string; subcategoryId: string } {
  // Find the category
  const category = categories.find((cat) => cat.name === categoryName);

  if (!category) {
    // Fallback to "Other" category
    const otherCategory = categories.find((cat) => cat.name === 'Other')!;
    const uncategorizedSubcat = otherCategory.subcategories.find(
      (sub) => sub.name === 'Uncategorized'
    )!;

    return {
      categoryId: otherCategory._id!,
      subcategoryId: uncategorizedSubcat._id,
    };
  }

  // Find the subcategory within the category
  const subcategory = category.subcategories.find((sub) => sub.name === subcategoryName);

  if (!subcategory) {
    // Fallback to "Other" subcategory within the category
    const otherSubcat = category.subcategories.find((sub) => sub.name === 'Other');

    if (otherSubcat) {
      return {
        categoryId: category._id!,
        subcategoryId: otherSubcat._id,
      };
    }

    // Ultimate fallback: use first subcategory
    return {
      categoryId: category._id!,
      subcategoryId: category.subcategories[0]._id,
    };
  }

  return {
    categoryId: category._id!,
    subcategoryId: subcategory._id,
  };
}

export async function importExpenses(
  fileContent: string,
  statementMonth: number,
  statementYear: number
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Parse CSV
    const { rows } = await parseCSV(fileContent);

    if (rows.length === 0) {
      return { success: false, count: 0, error: 'No valid rows found in CSV' };
    }

    // Fetch all categories for ID resolution
    const categories = await getAllCategories();

    // Detect installments before categorization
    const expensesWithInstallments = rows.map((row) => {
      const installmentInfo = detectInstallment(row.description);
      return { ...row, installmentInfo };
    });

    // Categorize all expenses with AI using batch processing
    console.log(`Categorizing ${rows.length} expenses with AI (batches of 10)...`);
    const categorizations = await categorizeBatchExpenses(
      rows.map((row) => ({
        description: row.description,
        amount: row.amount,
      }))
    );

    // Prepare expenses for insertion
    const now = new Date();
    const expenses: Omit<Expense, '_id'>[] = rows.map((row, index) => {
      // Resolve category and subcategory names to ObjectIds
      const { categoryId, subcategoryId } = resolveCategoryIds(
        categorizations[index].category,
        categorizations[index].subcategory,
        categories
      );

      return {
        description: row.description,
        amount: row.amount,
        date: new Date(row.date),
        categoryId,
        subcategoryId,
        categoryConfidence: categorizations[index].confidence,
        merchantName: categorizations[index].merchantName,
        statementMonth,
        statementYear,
        rawCsvRow: JSON.stringify(row),
        aiInsights: {
          isRecurring: categorizations[index].isRecurring,
          suggestedBudgetCategory: categorizations[index].suggestedBudgetCategory,
          notes: categorizations[index].notes,
          ...(expensesWithInstallments[index].installmentInfo.isInstallment && {
            installment: {
              current: expensesWithInstallments[index].installmentInfo.currentInstallment!,
              total: expensesWithInstallments[index].installmentInfo.totalInstallments!,
              baseDescription: expensesWithInstallments[index].installmentInfo.baseDescription!,
            },
          }),
        },
        createdAt: now,
        updatedAt: now,
      };
    });

    // Insert into database
    const collection = await getExpensesCollection();
    const result = await collection.insertMany(expenses);

    console.log(`Successfully imported ${result.insertedCount} expenses`);

    return {
      success: true,
      count: result.insertedCount,
    };
  } catch (error) {
    console.error('Error importing expenses:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
