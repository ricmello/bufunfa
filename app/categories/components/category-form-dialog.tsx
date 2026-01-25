'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { IconPicker } from '@/components/ui/icon-picker';
import { Category } from '@/lib/types/category';
import { createCategory, updateCategory } from '@/lib/actions/categories';

interface CategoryFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category?: Category;
}

export function CategoryFormDialog({
  isOpen,
  onClose,
  category,
}: CategoryFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [hint, setHint] = useState('');
  const [icon, setIcon] = useState('MoreHorizontal');

  // Initialize form with category data when editing
  useEffect(() => {
    if (category) {
      setName(category.name);
      setColor(category.color);
      setHint(category.hint || '');
      setIcon(category.icon);
    } else {
      // Reset form when creating new category
      setName('');
      setColor('#3b82f6');
      setHint('');
      setIcon('MoreHorizontal');
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (category) {
        // Update existing category
        const result = await updateCategory(category._id!, {
          name: name.trim(),
          color,
          hint: hint.trim() || null,
          icon,
        });

        if (result.success) {
          toast.success(`Category "${name}" updated successfully`);
          onClose();
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to update category');
        }
      } else {
        // Create new category
        const result = await createCategory({
          name: name.trim(),
          color,
          hint: hint.trim() || null,
          icon,
        });

        if (result.success) {
          toast.success(`Category "${name}" created successfully`);
          onClose();
          router.refresh();
        } else {
          toast.error(result.error || 'Failed to create category');
        }
      }
    } catch (error) {
      toast.error('An error occurred while saving the category');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? 'Edit Category' : 'Create Category'}</DialogTitle>
          <DialogDescription>
            {category
              ? 'Update the category details below.'
              : 'Add a new expense category with a custom color and icon.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Farmácia"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>

            <div className="grid gap-2">
              <Label>Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hint">
                Categorization Hint
                <span className="text-muted-foreground text-xs ml-2">(optional)</span>
              </Label>
              <Textarea
                id="hint"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
                placeholder="e.g., Drugstores, pharmacies: Raia, Pacheco, Venancio"
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Provide examples of merchants or keywords to help AI categorize expenses correctly.
              </p>
            </div>
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
                : category
                  ? 'Update Category'
                  : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
