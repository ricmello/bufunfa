import { getCategoryBreakdown } from '@/lib/actions/expenses';
import { getCategoryColorMap } from '@/lib/actions/category-colors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CategoryBreakdownChartClient } from './category-breakdown-chart-client';

export async function CategoryBreakdownChart() {
  // Get current month and year
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
  const currentYear = now.getFullYear();

  const breakdown = await getCategoryBreakdown(currentMonth, currentYear);
  const categoryColors = await getCategoryColorMap();

  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Current month spending by category</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses for the current month yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <CategoryBreakdownChartClient breakdown={breakdown} categoryColors={categoryColors} />;
}
