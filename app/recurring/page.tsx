import { Suspense } from 'react';
import { RecurringExpenseListClient } from './components/recurring-expense-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Recurring Expenses | Bufunfa',
  description: 'Manage recurring expenses and forecast future transactions',
};

function RecurringExpenseListSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function RecurringExpensesPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Recurring Expenses</h1>
        <p className="text-muted-foreground">
          Manage recurring expenses and automatically generate forecasts
        </p>
      </div>

      <Suspense fallback={<RecurringExpenseListSkeleton />}>
        <RecurringExpenseListClient />
      </Suspense>
    </div>
  );
}
