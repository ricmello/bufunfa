import { getRecentExpenses } from '@/lib/actions/expenses';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const categoryColors: Record<string, string> = {
  Food: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20',
  Transport: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
  Shopping: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
  Entertainment: 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20',
  Bills: 'bg-red-500/10 text-red-500 hover:bg-red-500/20',
  Health: 'bg-green-500/10 text-green-500 hover:bg-green-500/20',
  Other: 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20',
};

export async function RecentExpenses() {
  const expenses = await getRecentExpenses(7);

  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No expenses found. Import your first statement to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell className="font-medium">
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {expense.merchantName || expense.description}
                    </p>
                    {expense.merchantName && (
                      <p className="text-xs text-muted-foreground">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={categoryColors[expense.category] || categoryColors.Other}
                  >
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {expense.amount < 0 ? '-' : '+'}$
                  {Math.abs(expense.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
