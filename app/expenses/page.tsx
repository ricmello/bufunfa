import { Suspense } from 'react';
import { ExpenseListClient } from './components/expense-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
        <p className="text-muted-foreground">
          Manage and organize all your expenses
        </p>
      </div>

      <Suspense fallback={<ExpensesPageSkeleton />}>
        <ExpenseListClient />
      </Suspense>
    </div>
  );
}

function ExpensesPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
