import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUpcomingForecasts } from '@/lib/actions/forecast-queries';

export async function UpcomingForecasts() {
  const forecasts = await getUpcomingForecasts(30);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Next 30 Days
        </CardTitle>
        <CardDescription>Upcoming forecast expenses</CardDescription>
      </CardHeader>
      <CardContent>
        {forecasts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming forecasts
          </p>
        ) : (
          <div className="space-y-3">
            {forecasts.slice(0, 8).map((forecast) => (
              <div
                key={forecast._id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{forecast.description}</p>
                    {forecast.isForecast && (
                      <Badge variant="outline" className="text-xs">
                        🔮
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{forecast.categoryIcon || '📦'}</span>
                    <span>{forecast.categoryName}</span>
                    <span>•</span>
                    <span>
                      {forecast.forecastDate
                        ? format(new Date(forecast.forecastDate), 'MMM d')
                        : format(new Date(forecast.date), 'MMM d')}
                    </span>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    forecast.amount < 0
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400'
                  }
                >
                  R$ {Math.abs(forecast.amount).toFixed(2)}
                </Badge>
              </div>
            ))}
            {forecasts.length > 8 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                + {forecasts.length - 8} more forecast{forecasts.length - 8 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
