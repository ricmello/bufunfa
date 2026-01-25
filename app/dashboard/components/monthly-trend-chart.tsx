import { getMonthlyTrends } from '@/lib/actions/expenses';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MonthlyTrendChartClient } from './monthly-trend-chart-client';

export async function MonthlyTrendChart() {
  const trends = await getMonthlyTrends(6);

  if (trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Last 6 months overview</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Not enough data to show trends yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <MonthlyTrendChartClient trends={trends} />;
}
