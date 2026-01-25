'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { MonthlyTrend } from '@/lib/actions/expenses';

const chartConfig = {
  totalExpenses: {
    label: 'Expenses',
    color: 'hsl(var(--destructive))',
  },
  totalCredits: {
    label: 'Credits',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

interface MonthlyTrendChartClientProps {
  trends: MonthlyTrend[];
}

export function MonthlyTrendChartClient({ trends }: MonthlyTrendChartClientProps) {
  const chartData = trends.map((trend) => ({
    name: `${trend.month} ${trend.year}`,
    totalExpenses: trend.totalExpenses,
    totalCredits: trend.totalCredits,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Trends</CardTitle>
        <CardDescription>Last 6 months overview</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="totalExpenses"
                stroke="var(--color-totalExpenses)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="totalCredits"
                stroke="var(--color-totalCredits)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
