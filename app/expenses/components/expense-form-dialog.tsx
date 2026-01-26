'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getAllCategories } from '@/lib/actions/categories';
import type { Category } from '@/lib/types/category';
import {
  addExpense,
  updateExpense,
  type ExpenseFormData,
  type ExpenseWithCategory,
} from '@/lib/actions/expense-mutations';

interface ExpenseFormDialogProps {
  isOpen: boolean;
  expense?: ExpenseWithCategory;
  onClose: () => void;
  onSuccess: () => void;
}

export function ExpenseFormDialog({
  isOpen,
  expense,
  onClose,
  onSuccess,
}: ExpenseFormDialogProps) {
  const isEditMode = !!expense;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: 0,
    date: new Date(),
    categoryId: '',
    subcategoryId: '',
    merchantName: null,
    notes: null,
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getAllCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  // Pre-populate form when editing
  useEffect(() => {
    if (expense) {
      setFormData({
        description: expense.description,
        amount: expense.amount,
        date: new Date(expense.date),
        categoryId: expense.categoryId,
        subcategoryId: expense.subcategoryId,
        merchantName: expense.merchantName,
        notes: expense.aiInsights.notes,
      });
    } else {
      // Reset form for add mode
      setFormData({
        description: '',
        amount: 0,
        date: new Date(),
        categoryId: '',
        subcategoryId: '',
        merchantName: null,
        notes: null,
      });
    }
  }, [expense, isOpen]);

  const selectedCategory = categories.find(
    (c) => c._id === formData.categoryId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (formData.amount === 0) {
      toast.error('Amount cannot be zero');
      return;
    }
    if (!formData.categoryId) {
      toast.error('Category is required');
      return;
    }
    if (!formData.subcategoryId) {
      toast.error('Subcategory is required');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (isEditMode) {
        result = await updateExpense(expense._id, formData);
      } else {
        result = await addExpense(formData);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to save expense');
      }
    } catch (error) {
      toast.error('Failed to save expense');
      console.error('Error saving expense:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Expense' : 'Add Expense'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of this expense.'
              : 'Add a new expense to your records.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Description */}
          <div>
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Grocery shopping"
              required
            />
          </div>

          {/* Merchant Name */}
          <div>
            <Label htmlFor="merchantName">Merchant Name</Label>
            <Input
              id="merchantName"
              value={formData.merchantName || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  merchantName: e.target.value || null,
                })
              }
              placeholder="e.g., Whole Foods"
            />
          </div>

          {/* Amount and Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">
                Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0.00"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use negative for expenses, positive for credits
              </p>
            </div>
            <div>
              <Label htmlFor="date">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={
                  formData.date
                    ? new Date(formData.date).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    date: new Date(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    categoryId: value,
                    subcategoryId: '', // Reset subcategory
                  })
                }
                required
              >
                <SelectTrigger id="category">
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
              <Label htmlFor="subcategory">
                Subcategory <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.subcategoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subcategoryId: value })
                }
                disabled={!selectedCategory}
                required
              >
                <SelectTrigger id="subcategory">
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

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value || null })
              }
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                  ? 'Update'
                  : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
