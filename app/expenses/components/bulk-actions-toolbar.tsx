'use client';

import { useState, useEffect } from 'react';
import { Trash2, Tag, X } from 'lucide-react';
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
} from '@/lib/actions/expense-mutations';

interface BulkActionsToolbarProps {
  selectedCount: number;
  selectedIds: string[];
  onComplete: () => void;
  onCancel: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  selectedIds,
  onComplete,
  onCancel,
}: BulkActionsToolbarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRecategorizeDialog, setShowRecategorizeDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRecategorizing, setIsRecategorizing] = useState(false);

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

  return (
    <>
      <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="bg-white text-primary">
            {selectedCount} selected
          </Badge>
          <div className="flex gap-2">
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
    </>
  );
}
