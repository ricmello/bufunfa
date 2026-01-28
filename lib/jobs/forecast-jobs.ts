'use server';

import { getRecurringExpensesCollection, getExpensesCollection } from '@/lib/db/collections';
import { generateForecastDates } from '@/lib/utils/date-calculations';
import type { RecurringExpense } from '@/lib/types/recurring-expense';

/**
 * Extend forecast window for all active recurring templates
 * Ensures forecasts always extend at least 3 months into the future
 * Run daily via cron job
 */
export async function extendForecastWindow(): Promise<void> {
  try {
    const recurringCollection = await getRecurringExpensesCollection();
    const expensesCollection = await getExpensesCollection();

    // Find all active recurring templates
    const templates = await recurringCollection
      .find({ isActive: true })
      .toArray();

    if (templates.length === 0) {
      console.log('✅ No active recurring templates to extend');
      return;
    }

    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    threeMonthsFromNow.setUTCHours(0, 0, 0, 0);

    let extendedCount = 0;
    let totalForecastsCreated = 0;

    for (const template of templates) {
      // Find latest forecast for this template
      const latestForecast = await expensesCollection
        .findOne(
          { recurringExpenseId: template._id.toString(), isForecast: true },
          { sort: { forecastDate: -1 } }
        );

      // If last forecast < 3 months ahead, create 3 more months
      if (!latestForecast || new Date(latestForecast.forecastDate!) < threeMonthsFromNow) {
        const templateWithId: RecurringExpense = {
          ...template,
          _id: template._id.toString(),
        };

        const lastDate = latestForecast?.forecastDate || template.startDate;
        const newForecasts = generateForecastDates(templateWithId, new Date(lastDate), 3);

        if (newForecasts.length > 0) {
          await expensesCollection.insertMany(newForecasts as any);
          extendedCount++;
          totalForecastsCreated += newForecasts.length;
        }
      }
    }

    console.log(`✅ Extended forecasts for ${extendedCount}/${templates.length} templates (${totalForecastsCreated} new forecasts created)`);
  } catch (error) {
    console.error('❌ Error extending forecast window:', error);
    throw error;
  }
}

/**
 * Convert forecast expenses to real expenses when their date arrives
 * Run daily via cron job at midnight UTC
 */
export async function convertForecastsToReal(): Promise<void> {
  try {
    const expensesCollection = await getExpensesCollection();

    // Get today at UTC midnight
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Convert all forecasts where forecastDate <= today
    const result = await expensesCollection.updateMany(
      {
        isForecast: true,
        forecastDate: { $lte: today },
      } as any,
      {
        $set: {
          isForecast: false,
          updatedAt: new Date(),
        },
      }
    );

    console.log(`✅ Converted ${result.modifiedCount} forecasts to real expenses`);
  } catch (error) {
    console.error('❌ Error converting forecasts to real:', error);
    throw error;
  }
}
