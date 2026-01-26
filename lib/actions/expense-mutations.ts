'use server';

import { ObjectId } from 'mongodb';
import { getExpensesCollection } from '@/lib/db/collections';
import { getAllCategories } from './categories';

// ============================================================================
// Types
// ============================================================================

export interface ExpenseFilters {
  dateFrom?: Date;
  dateTo?: Date;
  categoryId?: string;
  subcategoryId?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  type?: 'expense' | 'credit' | 'all';
  page?: number;
  pageSize?: number;
  sortBy?: 'date' | 'amount' | 'description' | 'category';
  sortOrder?: 'asc' | 'desc';
}

export interface ExpenseWithCategory {
  _id: string;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  subcategoryId: string;
  subcategoryName: string;
  merchantName: string | null;
  categoryConfidence: number;
  statementMonth: number;
  statementYear: number;
  aiInsights: {
    isRecurring: boolean;
    suggestedBudgetCategory: string;
    notes: string | null;
    installment?: {
      current: number;
      total: number;
      baseDescription: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedExpenses {
  expenses: ExpenseWithCategory[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ExpenseFormData {
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  subcategoryId: string;
  merchantName: string | null;
  notes: string | null;
}

// ============================================================================
// Query Functions
// ============================================================================

export async function getExpenses(
  filters: ExpenseFilters = {}
): Promise<PaginatedExpenses> {
  try {
    const collection = await getExpensesCollection();

    // Build match query
    const matchQuery: any = {};

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      matchQuery.date = {};
      if (filters.dateFrom) {
        matchQuery.date.$gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        matchQuery.date.$lte = filters.dateTo;
      }
    }

    // Category filter
    if (filters.categoryId) {
      matchQuery.categoryId = filters.categoryId;
    }

    // Subcategory filter
    if (filters.subcategoryId) {
      matchQuery.subcategoryId = filters.subcategoryId;
    }

    // Amount range filter
    if (filters.amountMin !== undefined || filters.amountMax !== undefined) {
      matchQuery.amount = {};
      if (filters.amountMin !== undefined) {
        matchQuery.amount.$gte = filters.amountMin;
      }
      if (filters.amountMax !== undefined) {
        matchQuery.amount.$lte = filters.amountMax;
      }
    }

    // Type filter (expense/credit)
    if (filters.type === 'expense') {
      matchQuery.amount = { ...matchQuery.amount, $lt: 0 };
    } else if (filters.type === 'credit') {
      matchQuery.amount = { ...matchQuery.amount, $gte: 0 };
    }

    // Search filter
    if (filters.search) {
      matchQuery.$or = [
        { description: { $regex: filters.search, $options: 'i' } },
        { merchantName: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    const sortField: any = {};
    sortField[sortBy] = sortOrder;

    // Use $facet to get count and data in single query
    const result = await collection
      .aggregate([
        { $match: matchQuery },
        {
          $facet: {
            metadata: [{ $count: 'totalCount' }],
            data: [
              { $sort: sortField },
              { $skip: skip },
              { $limit: pageSize },
              {
                $lookup: {
                  from: 'categories',
                  let: {
                    catId: { $toObjectId: '$categoryId' },
                    subId: '$subcategoryId',
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ['$_id', '$$catId'] },
                      },
                    },
                    {
                      $project: {
                        name: 1,
                        color: 1,
                        subcategory: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: '$subcategories',
                                as: 'sub',
                                cond: { $eq: ['$$sub._id', '$$subId'] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  ],
                  as: 'categoryData',
                },
              },
              {
                $unwind: {
                  path: '$categoryData',
                  preserveNullAndEmptyArrays: true,
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
                  merchantName: 1,
                  categoryConfidence: 1,
                  statementMonth: 1,
                  statementYear: 1,
                  aiInsights: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  categoryName: {
                    $ifNull: ['$categoryData.name', 'Unknown'],
                  },
                  categoryColor: {
                    $ifNull: ['$categoryData.color', '#6b7280'],
                  },
                  subcategoryName: {
                    $ifNull: ['$categoryData.subcategory.name', 'Unknown'],
                  },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const totalCount =
      result[0]?.metadata[0]?.totalCount || 0;
    const expenses = result[0]?.data || [];

    // Convert ObjectIds to strings
    const transformedExpenses: ExpenseWithCategory[] = expenses.map(
      (expense: any) => ({
        ...expense,
        _id: expense._id.toString(),
        date: expense.date,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
      })
    );

    return {
      expenses: transformedExpenses,
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  } catch (error) {
    console.error('Error in getExpenses:', error);
    return {
      expenses: [],
      totalCount: 0,
      page: filters.page || 1,
      pageSize: filters.pageSize || 50,
      totalPages: 0,
    };
  }
}

// ============================================================================
// CRUD Operations
// ============================================================================

export async function addExpense(
  data: ExpenseFormData
): Promise<{ success: boolean; error?: string; expenseId?: string }> {
  try {
    // Validate category exists
    const categories = await getAllCategories();
    const category = categories.find((c) => c._id === data.categoryId);
    if (!category) {
      return { success: false, error: 'Invalid category' };
    }

    const subcategory = category.subcategories.find(
      (s) => s._id === data.subcategoryId
    );
    if (!subcategory) {
      return { success: false, error: 'Invalid subcategory' };
    }

    // Extract statement month/year from date
    const date = new Date(data.date);
    const statementMonth = date.getMonth() + 1;
    const statementYear = date.getFullYear();

    const collection = await getExpensesCollection();
    const now = new Date();

    const expense = {
      description: data.description,
      amount: data.amount,
      date: date,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      categoryConfidence: 1.0, // Manual entries have full confidence
      merchantName: data.merchantName || null,
      statementMonth,
      statementYear,
      rawCsvRow: '', // Manual entries have no CSV row
      createdAt: now,
      updatedAt: now,
      aiInsights: {
        isRecurring: false,
        suggestedBudgetCategory: category.name,
        notes: data.notes,
      },
    };

    const result = await collection.insertOne(expense);

    return {
      success: true,
      expenseId: result.insertedId.toString(),
    };
  } catch (error) {
    console.error('Error in addExpense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function updateExpense(
  id: string,
  data: ExpenseFormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate category exists
    const categories = await getAllCategories();
    const category = categories.find((c) => c._id === data.categoryId);
    if (!category) {
      return { success: false, error: 'Invalid category' };
    }

    const subcategory = category.subcategories.find(
      (s) => s._id === data.subcategoryId
    );
    if (!subcategory) {
      return { success: false, error: 'Invalid subcategory' };
    }

    // Extract statement month/year from date
    const date = new Date(data.date);
    const statementMonth = date.getMonth() + 1;
    const statementYear = date.getFullYear();

    const collection = await getExpensesCollection();

    const updateDoc = {
      $set: {
        description: data.description,
        amount: data.amount,
        date: date,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        merchantName: data.merchantName || null,
        statementMonth,
        statementYear,
        updatedAt: new Date(),
        'aiInsights.notes': data.notes,
      },
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) } as any,
      updateDoc
    );

    if (result.matchedCount === 0) {
      return { success: false, error: 'Expense not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateExpense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteExpense(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getExpensesCollection();

    const result = await collection.deleteOne({ _id: new ObjectId(id) } as any);

    if (result.deletedCount === 0) {
      return { success: false, error: 'Expense not found' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteExpense:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Bulk Operations
// ============================================================================

export async function bulkDeleteExpenses(
  ids: string[]
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (ids.length === 0) {
      return { success: false, error: 'No expenses selected' };
    }

    const collection = await getExpensesCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.deleteMany({
      _id: { $in: objectIds },
    } as any);

    return {
      success: true,
      count: result.deletedCount,
    };
  } catch (error) {
    console.error('Error in bulkDeleteExpenses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function bulkRecategorizeExpenses(
  ids: string[],
  categoryId: string,
  subcategoryId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    if (ids.length === 0) {
      return { success: false, error: 'No expenses selected' };
    }

    // Validate category exists
    const categories = await getAllCategories();
    const category = categories.find((c) => c._id === categoryId);
    if (!category) {
      return { success: false, error: 'Invalid category' };
    }

    const subcategory = category.subcategories.find(
      (s) => s._id === subcategoryId
    );
    if (!subcategory) {
      return { success: false, error: 'Invalid subcategory' };
    }

    const collection = await getExpensesCollection();
    const objectIds = ids.map((id) => new ObjectId(id));

    const result = await collection.updateMany(
      { _id: { $in: objectIds } } as any,
      {
        $set: {
          categoryId,
          subcategoryId,
          updatedAt: new Date(),
        },
      }
    );

    return {
      success: true,
      count: result.modifiedCount,
    };
  } catch (error) {
    console.error('Error in bulkRecategorizeExpenses:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CSV Export
// ============================================================================

export async function exportExpensesToCSV(
  filters: ExpenseFilters = {}
): Promise<{ success: boolean; csv?: string; error?: string }> {
  try {
    // Get all expenses matching filters (with high page size)
    const data = await getExpenses({
      ...filters,
      page: 1,
      pageSize: 100000,
    });

    if (data.expenses.length === 0) {
      return { success: false, error: 'No expenses to export' };
    }

    // CSV headers
    const headers = [
      'Date',
      'Description',
      'Merchant',
      'Amount',
      'Category',
      'Subcategory',
      'Recurring',
      'Notes',
    ];

    // Escape CSV values
    const escapeCsv = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows = data.expenses.map((expense) => [
      escapeCsv(new Date(expense.date).toISOString().split('T')[0]),
      escapeCsv(expense.description),
      escapeCsv(expense.merchantName || ''),
      escapeCsv(expense.amount.toFixed(2)),
      escapeCsv(expense.categoryName),
      escapeCsv(expense.subcategoryName),
      escapeCsv(expense.aiInsights.isRecurring ? 'Yes' : 'No'),
      escapeCsv(expense.aiInsights.notes || ''),
    ]);

    // Combine headers and rows
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n'
    );

    return {
      success: true,
      csv,
    };
  } catch (error) {
    console.error('Error in exportExpensesToCSV:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
