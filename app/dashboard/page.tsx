import { Suspense } from 'react';
import { RecentExpenses } from './components/recent-expenses';
import { TopExpensesChart } from './components/top-expenses-chart';
import { MonthlyTrendChart } from './components/monthly-trend-chart';
import { CategoryBreakdownChart } from './components/category-breakdown-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="container px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your expenses and spending patterns
        </p>
      </div>

      <div className="grid gap-6">
        {/* Charts Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<LoadingSkeleton />}>
            <TopExpensesChart />
          </Suspense>
          <Suspense fallback={<LoadingSkeleton />}>
            <MonthlyTrendChart />
          </Suspense>
          <Suspense fallback={<LoadingSkeleton />}>
            <CategoryBreakdownChart />
          </Suspense>
        </div>

        {/* Recent Expenses */}
        <Suspense fallback={<LoadingSkeleton />}>
          <RecentExpenses />
        </Suspense>
      </div>
    </div>
  );
}
