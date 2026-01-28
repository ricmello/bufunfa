'use client';

import { useState, useEffect } from 'react';
import { Trash2, Tag, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getAllCategories } from '@/lib/actions/categories';
import type { Category } from '@/lib/types/category';
import {
  bulkDeleteExpenses,
  bulkRecategorizeExpenses,
  type ExpenseWithCategory,
} from '@/lib/actions/expense-mutations';
import {
  bulkConfirmForecasts,
  bulkDeleteForecasts,
} from '@/lib/actions/forecast-mutations';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  expenses: ExpenseWithCategory[];
  onComplete: () => void;
  onCancel: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  expenses,
  onComplete,
  onCancel,
}: BulkActionsToolbarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRecategorizeDialog, setShowRecategorizeDialog] = useState(false);
  const [showConfirmForecastsDialog, setShowConfirmForecastsDialog] = useState(false);
  const [showDeleteForecastsDialog, setShowDeleteForecastsDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecategorizing, setIsRecategorizing] = useState(false);
  const [isConfirmingForecasts, setIsConfirmingForecasts] = useState(false);
  const [isDeletingForecasts, setIsDeletingForecasts] = useState(false);

  // Recategorize form state
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getAllCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  const selectedCategory = categories.find((c) => c._id === categoryId);

  // Calculate forecast counts
  const selectedForecasts = selectedIds.filter(id => {
    const expense = expenses.find(e => e._id === id);
    return expense?.isForecast;
  });
  const forecastCount = selectedForecasts.length;
  const hasForecastsSelected = forecastCount > 0;
  const hasOnlyForecasts = forecastCount === selectedCount;

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await bulkDeleteExpenses(selectedIds);
      if (result.success) {
        toast.success(`${result.count} expense(s) deleted successfully`);
        onComplete();
        setShowDeleteDialog(false);
      } else {
        toast.error(result.error || 'Failed to delete expenses');
      }
    } catch (error) {
      toast.error('Failed to delete expenses');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkRecategorize = async () => {
    if (!categoryId || !subcategoryId) {
      toast.error('Please select both category and subcategory');
      return;
    }

    setIsRecategorizing(true);
    try {
      const result = await bulkRecategorizeExpenses(
        selectedIds,
        categoryId,
        subcategoryId
      );
      if (result.success) {
        toast.success(`${result.count} expense(s) recategorized successfully`);
        onComplete();
        setShowRecategorizeDialog(false);
        setCategoryId('');
        setSubcategoryId('');
      } else {
        toast.error(result.error || 'Failed to recategorize expenses');
      }
    } catch (error) {
      toast.error('Failed to recategorize expenses');
    } finally {
      setIsRecategorizing(false);
    }
  };

  const handleBulkConfirmForecasts = async () => {
    setIsConfirmingForecasts(true);
    try {
      const result = await bulkConfirmForecasts(selectedForecasts);
      if (result.success) {
        toast.success(`${result.count} forecast(s) confirmed successfully`);
        onComplete();
        setShowConfirmForecastsDialog(false);
      } else {
        toast.error(result.error || 'Failed to confirm forecasts');
      }
    } catch (error) {
      toast.error('Failed to confirm forecasts');
    } finally {
      setIsConfirmingForecasts(false);
    }
  };

  const handleBulkDeleteForecasts = async () => {
    setIsDeletingForecasts(true);
    try {
      const result = await bulkDeleteForecasts(selectedForecasts);
      if (result.success) {
        toast.success(`${result.count} forecast(s) deleted successfully`);
        onComplete();
        setShowDeleteForecastsDialog(false);
      } else {
        toast.error(result.error || 'Failed to delete forecasts');
      }
    } catch (error) {
      toast.error('Failed to delete forecasts');
    } finally {
      setIsDeletingForecasts(false);
    }
  };

  return (
    <>
      <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white text-primary">
            {selectedCount} selected
          </Badge>
          <div className="flex gap-2">
            {hasForecastsSelected && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowConfirmForecastsDialog(true)}
                  className="bg-green-600 text-white hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm {forecastCount} Forecast{forecastCount > 1 ? 's' : ''}
                </Button>
                {hasOnlyForecasts && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteForecastsDialog(true)}
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forecasts
                  </Button>
                )}
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowRecategorizeDialog(true)}
            >
              <Tag className="mr-2 h-4 w-4" />
              Recategorize
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
          <span className="sr-only">Cancel selection</span>
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Expenses</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedCount} expense(s)? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recategorize Dialog */}
      <Dialog
        open={showRecategorizeDialog}
        onOpenChange={setShowRecategorizeDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Recategorize {selectedCount} Expenses
            </DialogTitle>
            <DialogDescription>
              Select a new category and subcategory for the selected expenses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="bulk-category">Category</Label>
              <Select
                value={categoryId}
                onValueChange={(value) => {
                  setCategoryId(value);
                  setSubcategoryId(''); // Reset subcategory
                }}
              >
                <SelectTrigger id="bulk-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id!}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bulk-subcategory">Subcategory</Label>
              <Select
                value={subcategoryId}
                onValueChange={setSubcategoryId}
                disabled={!selectedCategory}
              >
                <SelectTrigger id="bulk-subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCategory?.subcategories.map((sub: { _id: string; name: string }) => (
                    <SelectItem key={sub._id} value={sub._id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRecategorizeDialog(false)}
              disabled={isRecategorizing}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkRecategorize} disabled={isRecategorizing}>
              {isRecategorizing ? 'Updating...' : 'Update All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Forecasts Dialog */}
      <AlertDialog
        open={showConfirmForecastsDialog}
        onOpenChange={setShowConfirmForecastsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {forecastCount} Forecast{forecastCount > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm {forecastCount} forecast{forecastCount > 1 ? 's' : ''}?
              This will convert them to real expenses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isConfirmingForecasts}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkConfirmForecasts}
              disabled={isConfirmingForecasts}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConfirmingForecasts ? 'Confirming...' : 'Confirm All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Forecasts Dialog */}
      <AlertDialog
        open={showDeleteForecastsDialog}
        onOpenChange={setShowDeleteForecastsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {forecastCount} Forecast{forecastCount > 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {forecastCount} forecast{forecastCount > 1 ? 's' : ''}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingForecasts}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDeleteForecasts}
              disabled={isDeletingForecasts}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingForecasts ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
