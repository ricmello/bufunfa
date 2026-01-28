/**
 * Date Calculation Utilities for Recurring Expenses
 * Handles monthly/weekly forecast generation with edge cases
 */

import type { RecurringExpense } from '@/lib/types/recurring-expense';
import type { Expense, ExpenseInsert } from '@/lib/types/expense';

/**
 * Get next monthly occurrence date, handling edge cases
 * - Day 31 in Feb → Feb 28/29
 * - Day 30 in Feb → Feb 28/29
 * - Clamps to actual days in month
 */
export function getNextMonthlyDate(baseDate: Date, dayOfMonth: number): Date {
  const result = new Date(baseDate);

  // Move to next month
  result.setUTCMonth(result.getUTCMonth() + 1);

  // Get the last day of the target month
  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();

  // Clamp dayOfMonth to actual days in month
  const clampedDay = Math.min(dayOfMonth, lastDayOfMonth);

  result.setUTCDate(clampedDay);
  result.setUTCHours(0, 0, 0, 0);

  return result;
}

/**
 * Get next weekly occurrence date
 * @param baseDate Starting date
 * @param dayOfWeek Target day (0 = Sunday, 6 = Saturday)
 */
export function getNextWeeklyDate(baseDate: Date, dayOfWeek: number): Date {
  const result = new Date(baseDate);
  const currentDay = result.getUTCDay();

  // Calculate days until target day
  let daysToAdd = dayOfWeek - currentDay;
  if (daysToAdd <= 0) {
    daysToAdd += 7; // Next week
  }

  result.setUTCDate(result.getUTCDate() + daysToAdd);
  result.setUTCHours(0, 0, 0, 0);

  return result;
}

/**
 * Generate forecast expenses from recurring template
 * @param template Recurring expense template
 * @param startFrom Date to start generating from (default: template.startDate)
 * @param months Number of months to generate (default: template.forecastMonths)
 * @returns Array of forecast expenses
 */
export function generateForecastDates(
  template: RecurringExpense,
  startFrom?: Date,
  months?: number
): ExpenseInsert[] {
  const forecasts: ExpenseInsert[] = [];
  const generateMonths = months ?? template.forecastMonths;

  // Calculate end date for generation window
  const windowEnd = new Date(startFrom || template.startDate);
  windowEnd.setUTCMonth(windowEnd.getUTCMonth() + generateMonths);

  let currentDate = new Date(startFrom || template.startDate);
  currentDate.setUTCHours(0, 0, 0, 0);

  // Generate occurrences until window end (or template endDate)
  const maxIterations = template.frequency === 'weekly' ? generateMonths * 5 : generateMonths;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Calculate next occurrence based on frequency
    if (template.frequency === 'monthly' && template.dayOfMonth) {
      currentDate = getNextMonthlyDate(currentDate, template.dayOfMonth);
    } else if (template.frequency === 'weekly' && template.dayOfWeek !== undefined) {
      currentDate = getNextWeeklyDate(currentDate, template.dayOfWeek);
    } else {
      console.error('Invalid frequency configuration:', template);
      break;
    }

    // Stop if past window end
    if (currentDate > windowEnd) break;

    // Stop if past template endDate
    if (template.endDate && currentDate > new Date(template.endDate)) break;

    // Create forecast expense
    const forecastExpense: ExpenseInsert = {
      description: template.description,
      amount: template.amount,
      date: new Date(currentDate), // Transaction date
      categoryId: template.categoryId,
      subcategoryId: template.subcategoryId,
      categoryConfidence: 1.0, // User-defined, high confidence
      merchantName: template.merchantName || null,
      statementMonth: currentDate.getUTCMonth() + 1,
      statementYear: currentDate.getUTCFullYear(),
      rawCsvRow: `FORECAST:${template._id}`,
      aiInsights: {
        isRecurring: true,
        suggestedBudgetCategory: '',
        notes: 'Auto-generated from recurring template',
      },
      // Recurring fields
      userId: template.userId,
      recurringExpenseId: template._id?.toString(),
      isForecast: true,
      forecastDate: new Date(currentDate),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    forecasts.push(forecastExpense);
  }

  return forecasts;
}

/**
 * Check if a year is a leap year
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Get the last day of a month
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/**
 * Format frequency for display
 */
export function formatFrequency(
  frequency: 'monthly' | 'weekly',
  dayOfMonth?: number,
  dayOfWeek?: number
): string {
  if (frequency === 'monthly' && dayOfMonth) {
    const suffix = getDayOrdinalSuffix(dayOfMonth);
    return `Monthly on the ${dayOfMonth}${suffix}`;
  }

  if (frequency === 'weekly' && dayOfWeek !== undefined) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `Weekly on ${days[dayOfWeek]}`;
  }

  return frequency;
}

/**
 * Get ordinal suffix for day (1st, 2nd, 3rd, etc.)
 */
function getDayOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th';

  const lastDigit = day % 10;
  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}
