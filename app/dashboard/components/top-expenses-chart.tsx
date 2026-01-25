import { getTopExpenses } from '@/lib/actions/expenses';
import { getCategoryColorMap } from '@/lib/actions/category-colors';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TopExpensesChartClient } from './top-expenses-chart-client';

export async function TopExpensesChart() {
  const expenses = await getTopExpenses(10);
  const categoryColors = await getCategoryColorMap();

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Expenses</CardTitle>
          <CardDescription>Biggest spending items</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses to display yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <TopExpensesChartClient expenses={expenses} categoryColors={categoryColors} />;
}
