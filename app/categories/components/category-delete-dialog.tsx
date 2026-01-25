'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
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
import { Category } from '@/lib/types/category';
import { deleteCategory } from '@/lib/actions/categories';

interface CategoryDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category;
}

export function CategoryDeleteDialog({
  isOpen,
  onClose,
  category,
}: CategoryDeleteDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    try {
      const result = await deleteCategory(category._id!);

      if (result.success) {
        toast.success(`Category "${category.name}" deleted successfully`);
        onClose();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete category');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the category');
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Category</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the category <strong>{category.name}</strong>?
            All expenses in this category will be reassigned to "Other". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
