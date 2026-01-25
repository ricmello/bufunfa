import { getDataStats } from '@/lib/actions/settings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export async function DataStats() {
  const stats = await getDataStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Statistics</CardTitle>
        <CardDescription>Overview of your stored data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Transactions</p>
            <p className="text-2xl font-bold">{stats.totalExpenses}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Amount Tracked</p>
            <p className="text-2xl font-bold">
              ${stats.totalAmount.toFixed(2)}
            </p>
          </div>

          {stats.oldestDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Oldest Transaction</p>
              <p className="text-lg font-medium">
                {new Date(stats.oldestDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {stats.newestDate && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Newest Transaction</p>
              <p className="text-lg font-medium">
                {new Date(stats.newestDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
