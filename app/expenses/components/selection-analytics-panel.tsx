'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart3, Calendar, TrendingDown, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ExpenseWithCategory } from '@/lib/actions/expense-mutations';
import { calculateExpenseAnalytics } from '@/lib/utils/expense-analytics';

interface SelectionAnalyticsPanelProps {
  selectedExpenses: ExpenseWithCategory[];
  onClose: () => void;
}

export function SelectionAnalyticsPanel({
  selectedExpenses,
  onClose,
}: SelectionAnalyticsPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);

  // Load minimized preference from localStorage
  useEffect(() => {
    const preference = localStorage.getItem('expense-analytics-minimized');
    if (preference === 'true') {
      setIsMinimized(true);
    }
  }, []);

  // Save minimized preference to localStorage
  const handleToggleMinimize = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('expense-analytics-minimized', String(newState));
  };

  // Calculate analytics (cached with useMemo)
  const analytics = useMemo(
    () => calculateExpenseAnalytics(selectedExpenses),
    [selectedExpenses]
  );

  // Format date range
  const formatDateRange = (earliest: Date, latest: Date): string => {
    const sameDay = earliest.toDateString() === latest.toDateString();
    if (sameDay) {
      return earliest.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const sameYear = earliest.getFullYear() === latest.getFullYear();
    if (sameYear) {
      return `${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }

    return `${earliest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  // Empty state
  if (selectedExpenses.length === 0) {
    return null;
  }

  // Minimized view
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={handleToggleMinimize}
          className="shadow-lg"
          size="lg"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          {selectedExpenses.length} selected
          <Badge variant="secondary" className="ml-2">
            ${analytics.totalAmount.toFixed(2)}
          </Badge>
        </Button>
      </div>
    );
  }

  // Full view
  return (
    <Card className="fixed bottom-6 right-6 z-40 w-96 shadow-2xl max-sm:left-6 max-sm:right-6 max-sm:w-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <h3 className="font-semibold">Selection Analytics</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleMinimize}
              className="h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
              <span className="sr-only">Minimize</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="max-h-[500px]">
        <CardContent className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Selected</p>
              <p className="text-2xl font-bold">{analytics.totalExpenses}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">
                ${analytics.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-lg font-semibold">
                ${analytics.averageExpense.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="text-xs font-medium flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                {formatDateRange(analytics.dateRange.earliest, analytics.dateRange.latest)}
              </p>
            </div>
          </div>

          {/* Expense/Credit Breakdown */}
          {analytics.expenseBreakdown.positiveCount > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-semibold mb-2">Transaction Types</p>
              <div className="space-y-2">
                {analytics.expenseBreakdown.negativeCount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Expenses ({analytics.expenseBreakdown.negativeCount})
                    </span>
                    <span className="text-destructive font-medium">
                      -${analytics.expenseBreakdown.negativeTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                {analytics.expenseBreakdown.positiveCount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">
                      Credits ({analytics.expenseBreakdown.positiveCount})
                    </span>
                    <span className="text-green-600 font-medium">
                      +${analytics.expenseBreakdown.positiveTotal.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Category Breakdown
            </p>
            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-3">
                {analytics.categoryBreakdown.map((category) => (
                  <Collapsible key={category.categoryId}>
                    <div className="space-y-2">
                      <CollapsibleTrigger className="w-full hover:opacity-80 transition-opacity">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: `${category.categoryColor}20`,
                              color: category.categoryColor,
                            }}
                          >
                            {category.categoryName}
                          </Badge>
                          <div className="text-sm font-medium">
                            ${category.total.toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({category.count})
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 mt-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${category.percentage}%`,
                              backgroundColor: category.categoryColor,
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-right mt-1">
                          {category.percentage.toFixed(1)}%
                        </p>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="pl-4 space-y-1">
                        {category.subcategories.map((sub) => (
                          <div
                            key={sub.subcategoryId}
                            className="flex justify-between items-center text-xs py-1"
                          >
                            <span className="text-muted-foreground">
                              {sub.subcategoryName}
                            </span>
                            <span className="font-medium">
                              ${sub.total.toFixed(2)}
                              <span className="text-muted-foreground ml-1">
                                ({sub.count}) {sub.percentage.toFixed(1)}%
                              </span>
                            </span>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Footer Note */}
          <div className="border-t pt-3">
            <p className="text-xs text-muted-foreground text-center">
              Selection limited to current page
            </p>
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
