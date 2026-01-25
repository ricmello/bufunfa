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
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { TopExpense } from '@/lib/actions/expenses';

const categoryColors: Record<string, string> = {
  Food: 'hsl(var(--chart-1))',
  Transport: 'hsl(var(--chart-2))',
  Shopping: 'hsl(var(--chart-3))',
  Entertainment: 'hsl(var(--chart-4))',
  Bills: 'hsl(var(--chart-5))',
  Health: 'hsl(var(--chart-6))',
  Other: 'hsl(var(--muted))',
};

const chartConfig = {
  amount: {
    label: 'Amount',
  },
} satisfies ChartConfig;

interface TopExpensesChartClientProps {
  expenses: TopExpense[];
}

export function TopExpensesChartClient({ expenses }: TopExpensesChartClientProps) {
  const chartData = expenses.map((expense) => ({
    name: expense.merchantName || expense.description.substring(0, 20),
    amount: expense.amount,
    fill: categoryColors[expense.category] || categoryColors.Other,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Expenses</CardTitle>
        <CardDescription>Biggest spending items</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis
                type="category"
                dataKey="name"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
