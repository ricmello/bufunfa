'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Plus } from 'lucide-react';
import type { ExpenseWithCategory } from '@/lib/types/expense';

interface PendingExpense {
  date: string;
  description: string;
  amount: number;
}

interface MergeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pendingExpense: PendingExpense | null;
  matchingForecasts: ExpenseWithCategory[];
  onMerge: (forecastId: string) => Promise<void>;
  onKeepBoth: () => Promise<void>;
  isProcessing: boolean;
}

export function MergeConfirmationDialog({
  open,
  onOpenChange,
  pendingExpense,
  matchingForecasts,
  onMerge,
  onKeepBoth,
  isProcessing,
}: MergeConfirmationDialogProps) {
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null);

  if (!pendingExpense || matchingForecasts.length === 0) {
    return null;
  }

  const handleMerge = async () => {
    if (!selectedForecastId) return;
    await onMerge(selectedForecastId);
    setSelectedForecastId(null);
  };

  const handleKeepBoth = async () => {
    await onKeepBoth();
    setSelectedForecastId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Forecast Match Found</DialogTitle>
          <DialogDescription>
            We found {matchingForecasts.length} forecast{matchingForecasts.length > 1 ? 's' : ''} that may match this imported expense
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Imported Expense */}
          <div>
            <h3 className="text-sm font-medium mb-2">Imported from Bank Statement:</h3>
            <div className="rounded-lg border p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{pendingExpense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(pendingExpense.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Badge variant="secondary" className="text-base">
                  R$ {Math.abs(pendingExpense.amount).toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Matching Forecasts */}
          <div>
            <h3 className="text-sm font-medium mb-2">Potential Forecast Matches:</h3>
            <div className="space-y-2">
              {matchingForecasts.map((forecast) => (
                <div
                  key={forecast._id}
                  className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                    selectedForecastId === forecast._id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedForecastId(forecast._id || null)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{forecast.description}</p>
                        <Badge variant="outline" className="text-xs">
                          🔮 Forecast
                        </Badge>
                        {selectedForecastId === forecast._id && (
                          <CheckCircle className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{forecast.categoryIcon}</span>
                        <span>{forecast.categoryName}</span>
                        <span>•</span>
                        <span>
                          {forecast.forecastDate
                            ? format(new Date(forecast.forecastDate), 'MMM d, yyyy')
                            : format(new Date(forecast.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {forecast.merchantName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {forecast.merchantName}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary">
                      R$ {Math.abs(forecast.amount).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <Alert>
            <AlertDescription>
              <strong>Merge:</strong> Updates the selected forecast with bank statement data and marks it as a real expense.
              <br />
              <strong>Keep Both:</strong> Imports as a new expense and keeps the forecast separate.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleKeepBoth}
            disabled={isProcessing}
          >
            <Plus className="mr-2 h-4 w-4" />
            Keep Both
          </Button>
          <Button
            onClick={handleMerge}
            disabled={!selectedForecastId || isProcessing}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {isProcessing ? 'Merging...' : 'Merge with Forecast'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
