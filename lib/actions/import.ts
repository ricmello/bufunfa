'use server';

import Papa from 'papaparse';
import { getExpensesCollection } from '../db/collections';
import { categorizeExpenses } from '../ai/categorize';
import { Expense } from '../types/expense';

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

    // Categorize all expenses with AI
    console.log(`Categorizing ${rows.length} expenses with AI...`);
    const categorizations = await categorizeExpenses(
      rows.map((row) => ({
        description: row.description,
        amount: row.amount,
      }))
    );

    // Prepare expenses for insertion
    const now = new Date();
    const expenses: Omit<Expense, '_id'>[] = rows.map((row, index) => ({
      description: row.description,
      amount: row.amount,
      date: new Date(row.date),
      category: categorizations[index].category,
      categoryConfidence: categorizations[index].confidence,
      merchantName: categorizations[index].merchantName,
      statementMonth,
      statementYear,
      rawCsvRow: JSON.stringify(row),
      aiInsights: {
        isRecurring: categorizations[index].isRecurring,
        suggestedBudgetCategory: categorizations[index].suggestedBudgetCategory,
        notes: categorizations[index].notes,
      },
      createdAt: now,
      updatedAt: now,
    }));

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
