import { getRecentExpenses } from '@/lib/actions/expenses';
import { getCategoryColorMap } from '@/lib/actions/category-colors';
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

export async function RecentExpenses() {
  const expenses = await getRecentExpenses(7);
  const colorMap = await getCategoryColorMap();

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
            {expenses.map((expense) => {
              const categoryColor = colorMap[expense.categoryName] || '#6b7280';
              return (
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
                    <div className="flex flex-col gap-1">
                      <Badge
                        variant="secondary"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                        }}
                      >
                        {expense.categoryName}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {expense.subcategoryName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {expense.amount < 0 ? '-' : '+'}$
                    {Math.abs(expense.amount).toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
