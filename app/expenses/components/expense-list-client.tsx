'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  getExpenses,
  type ExpenseFilters,
  type PaginatedExpenses,
  type ExpenseWithCategory,
} from '@/lib/actions/expense-mutations';
import { ExpenseFilters as ExpenseFiltersComponent } from './expense-filters';
import { ExpenseTable } from './expense-table';
import { ExpenseFormDialog } from './expense-form-dialog';
import { BulkActionsToolbar } from './bulk-actions-toolbar';
import { ExpenseExportButton } from './expense-export-button';
import { SelectionAnalyticsPanel } from './selection-analytics-panel';

export function ExpenseListClient() {
  const [data, setData] = useState<PaginatedExpenses>({
    expenses: [],
    totalCount: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ExpenseFilters>({
    page: 1,
    pageSize: 50,
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<ExpenseWithCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showAnalytics, setShowAnalytics] = useState(true);

  // Compute selected expenses
  const selectedExpenses = useMemo(
    () => data.expenses.filter((e) => selectedIds.has(e._id)),
    [data.expenses, selectedIds]
  );

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getExpenses(filters);
        setData(result);
        // Clear selection when data changes
        setSelectedIds(new Set());
      } catch (error) {
        toast.error('Failed to load expenses');
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Auto-show analytics on first selection
  useEffect(() => {
    if (selectedIds.size > 0 && !showAnalytics) {
      const preference = localStorage.getItem('expense-analytics-closed');
      if (preference !== 'true') {
        setShowAnalytics(true);
      }
    }
  }, [selectedIds.size, showAnalytics]);

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleSort = (sortBy: ExpenseFilters['sortBy']) => {
    setFilters((prev) => ({
      ...prev,
      sortBy,
      sortOrder:
        prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await getExpenses(filters);
        setData(result);
        setSelectedIds(new Set());
      } catch (error) {
        toast.error('Failed to refresh expenses');
      }
    });
  };

  const handleSelectionChange = (ids: Set<string>) => {
    setSelectedIds(ids);
  };

  const handleEditExpense = (expense: ExpenseWithCategory) => {
    setEditingExpense(expense);
  };

  const handleCloseEditDialog = () => {
    setEditingExpense(null);
  };

  const handleSuccess = () => {
    handleRefresh();
    toast.success('Expense saved successfully');
  };

  const handleBulkActionComplete = () => {
    handleRefresh();
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
        <ExpenseExportButton filters={filters} />
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          selectedIds={Array.from(selectedIds)}
          expenses={data.expenses}
          onComplete={handleBulkActionComplete}
          onCancel={() => setSelectedIds(new Set())}
        />
      )}

      {/* Filters */}
      <ExpenseFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* Table */}
      <ExpenseTable
        data={data}
        isLoading={isLoading || isPending}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        onEdit={handleEditExpense}
        onDelete={handleRefresh}
        onPageChange={handlePageChange}
        onSort={handleSort}
        currentSort={{
          sortBy: filters.sortBy || 'date',
          sortOrder: filters.sortOrder || 'desc',
        }}
      />

      {/* Add Dialog */}
      <ExpenseFormDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Edit Dialog */}
      {editingExpense && (
        <ExpenseFormDialog
          isOpen={true}
          expense={editingExpense}
          onClose={handleCloseEditDialog}
          onSuccess={handleSuccess}
        />
      )}

      {/* Selection Analytics Panel */}
      {selectedIds.size > 0 && showAnalytics && (
        <SelectionAnalyticsPanel
          selectedExpenses={selectedExpenses}
          onClose={() => {
            setShowAnalytics(false);
            localStorage.setItem('expense-analytics-closed', 'true');
          }}
        />
      )}
    </div>
  );
}
