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

const chartConfig = {
  amount: {
    label: 'Amount',
  },
} satisfies ChartConfig;

interface TopExpensesChartClientProps {
  expenses: TopExpense[];
  categoryColors: Record<string, string>;
}

export function TopExpensesChartClient({ expenses, categoryColors }: TopExpensesChartClientProps) {
  const chartData = expenses.map((expense) => ({
    name: expense.merchantName || expense.description.substring(0, 20),
    amount: expense.amount,
    category: expense.categoryName,
    subcategory: expense.subcategoryName,
    fill: categoryColors[expense.categoryName] || categoryColors['Other'] || '#6b7280',
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
