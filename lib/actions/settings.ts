'use server';

import { getExpensesCollection } from '../db/collections';

export async function deleteAllData(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const collection = await getExpensesCollection();
    const result = await collection.deleteMany({});

    console.log(`Deleted ${result.deletedCount} expenses`);

    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    console.error('Error deleting data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function getDataStats(): Promise<{
  totalExpenses: number;
  totalAmount: number;
  oldestDate: Date | null;
  newestDate: Date | null;
}> {
  try {
    const collection = await getExpensesCollection();

    const [stats] = await collection
      .aggregate([
        {
          $facet: {
            total: [{ $count: 'count' }],
            amount: [
              {
                $group: {
                  _id: null,
                  total: { $sum: { $abs: '$amount' } },
                },
              },
            ],
            dates: [
              {
                $group: {
                  _id: null,
                  oldest: { $min: '$date' },
                  newest: { $max: '$date' },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    return {
      totalExpenses: stats?.total?.[0]?.count || 0,
      totalAmount: stats?.amount?.[0]?.total || 0,
      oldestDate: stats?.dates?.[0]?.oldest || null,
      newestDate: stats?.dates?.[0]?.newest || null,
    };
  } catch (error) {
    console.error('Error fetching data stats:', error);
    return {
      totalExpenses: 0,
      totalAmount: 0,
      oldestDate: null,
      newestDate: null,
    };
  }
}
