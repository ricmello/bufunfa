import { getTopExpenses } from '@/lib/actions/expenses';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TopExpensesChartClient } from './top-expenses-chart-client';

export async function TopExpensesChart(): Promise<JSX.Element> {
  const expenses = await getTopExpenses(10);

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

  return <TopExpensesChartClient expenses={expenses} />;
}
