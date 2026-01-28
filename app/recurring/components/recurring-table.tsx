'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Edit2, StopCircle, Trash2, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { stopRecurringExpense, deleteRecurringExpense } from '@/lib/actions/recurring-expenses';
import { formatFrequency } from '@/lib/utils/date-calculations';
import type { RecurringExpenseWithCategory } from '@/lib/types/recurring-expense';
import { Skeleton } from '@/components/ui/skeleton';

interface RecurringTableProps {
  templates: RecurringExpenseWithCategory[];
  isLoading: boolean;
  onEdit: (template: RecurringExpenseWithCategory) => void;
  onDelete: () => void;
}

export function RecurringTable({
  templates,
  isLoading,
  onEdit,
  onDelete,
}: RecurringTableProps) {
  const [stopDialogOpen, setStopDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RecurringExpenseWithCategory | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleStop = async () => {
    if (!selectedTemplate) return;

    setIsProcessing(true);
    try {
      const result = await stopRecurringExpense(selectedTemplate._id!);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Recurring expense stopped. Future forecasts have been removed.',
        });
        onDelete();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to stop recurring expense',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop recurring expense',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setStopDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplate) return;

    setIsProcessing(true);
    try {
      const result = await deleteRecurringExpense(selectedTemplate._id!);
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Recurring expense deleted permanently.',
        });
        onDelete();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete recurring expense',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete recurring expense',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      setDeleteDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const getNextOccurrence = (template: RecurringExpenseWithCategory): string => {
    // Simple calculation for display
    const now = new Date();
    if (template.frequency === 'monthly' && template.dayOfMonth) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, template.dayOfMonth);
      return format(next, 'MMM d, yyyy');
    }
    if (template.frequency === 'weekly' && template.dayOfWeek !== undefined) {
      const daysUntil = (template.dayOfWeek - now.getDay() + 7) % 7 || 7;
      const next = new Date(now);
      next.setDate(next.getDate() + daysUntil);
      return format(next, 'MMM d, yyyy');
    }
    return 'N/A';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No recurring expenses</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Create recurring expenses to automatically generate forecasts
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Occurrence</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => (
              <TableRow key={template._id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{template.description}</p>
                    {template.merchantName && (
                      <p className="text-xs text-muted-foreground">
                        {template.merchantName}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={template.amount < 0 ? 'text-red-600' : 'text-green-600'}>
                    R$ {Math.abs(template.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{template.categoryIcon}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{template.categoryName}</span>
                      <span className="text-xs text-muted-foreground">
                        {template.subcategoryName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatFrequency(template.frequency, template.dayOfMonth, template.dayOfWeek)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{getNextOccurrence(template)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(template)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setStopDialogOpen(true);
                      }}
                    >
                      <StopCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Stop Confirmation Dialog */}
      <AlertDialog open={stopDialogOpen} onOpenChange={setStopDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the recurring template and delete all future forecasts.
              Past forecasts and real expenses will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleStop} disabled={isProcessing}>
              {isProcessing ? 'Stopping...' : 'Stop Recurring'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the recurring template and all associated forecasts.
              Real expenses will not be affected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
