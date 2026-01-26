'use client';

import { useState } from 'react';
import { Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  deleteExpense,
  type PaginatedExpenses,
  type ExpenseWithCategory,
  type ExpenseFilters,
} from '@/lib/actions/expense-mutations';

interface ExpenseTableProps {
  data: PaginatedExpenses;
  isLoading: boolean;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  onEdit: (expense: ExpenseWithCategory) => void;
  onDelete: () => void;
  onPageChange: (page: number) => void;
  onSort: (sortBy: ExpenseFilters['sortBy']) => void;
  currentSort: {
    sortBy: ExpenseFilters['sortBy'];
    sortOrder: 'asc' | 'desc';
  };
}

export function ExpenseTable({
  data,
  isLoading,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onPageChange,
  onSort,
  currentSort,
}: ExpenseTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data.expenses.map((e) => e._id));
      onSelectionChange(allIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    onSelectionChange(newSelected);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteExpense(deleteId);
      if (result.success) {
        toast.success('Expense deleted successfully');
        onDelete();
      } else {
        toast.error(result.error || 'Failed to delete expense');
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const renderSortIcon = (column: ExpenseFilters['sortBy']) => {
    if (currentSort.sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return currentSort.sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (data.expenses.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <p className="text-muted-foreground">
          No expenses found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  const allSelected =
    data.expenses.length > 0 &&
    data.expenses.every((e) => selectedIds.has(e._id));
  const someSelected = data.expenses.some((e) => selectedIds.has(e._id));

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all"
                  className={someSelected && !allSelected ? 'opacity-50' : ''}
                />
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('date')}
                  className="font-semibold"
                >
                  Date
                  {renderSortIcon('date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('description')}
                  className="font-semibold"
                >
                  Description
                  {renderSortIcon('description')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => onSort('category')}
                  className="font-semibold"
                >
                  Category
                  {renderSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => onSort('amount')}
                  className="font-semibold"
                >
                  Amount
                  {renderSortIcon('amount')}
                </Button>
              </TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.expenses.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(expense._id)}
                    onCheckedChange={(checked) =>
                      handleSelectOne(expense._id, checked as boolean)
                    }
                    aria-label={`Select ${expense.description}`}
                  />
                </TableCell>
                <TableCell>
                  {new Date(expense.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {expense.merchantName || expense.description}
                    </p>
                    {expense.merchantName && (
                      <p className="text-xs text-muted-foreground">
                        {expense.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: `${expense.categoryColor}20`,
                        color: expense.categoryColor,
                      }}
                    >
                      {expense.categoryName}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {expense.subcategoryName}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={
                      expense.amount < 0
                        ? 'text-destructive font-medium'
                        : 'text-green-600 font-medium'
                    }
                  >
                    {expense.amount < 0 ? '-' : '+'}$
                    {Math.abs(expense.amount).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(expense)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(expense._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.pageSize + 1} to{' '}
            {Math.min(data.page * data.pageSize, data.totalCount)} of{' '}
            {data.totalCount} expenses
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page - 1)}
              disabled={data.page === 1}
            >
              Previous
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                Page {data.page} of {data.totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
