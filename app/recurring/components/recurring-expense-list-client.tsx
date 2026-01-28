'use client';

import { useEffect, useState, useTransition } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getRecurringExpenses } from '@/lib/actions/recurring-expenses';
import type { RecurringExpenseWithCategory } from '@/lib/types/recurring-expense';
import { RecurringTable } from './recurring-table';
import { RecurringFormDialog } from './recurring-form-dialog';

export function RecurringExpenseListClient() {
  const [templates, setTemplates] = useState<RecurringExpenseWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringExpenseWithCategory | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await getRecurringExpenses();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching recurring expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recurring expenses',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleAdd = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: RecurringExpenseWithCategory) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
  };

  const handleFormComplete = () => {
    handleFormClose();
    startTransition(() => {
      fetchTemplates();
    });
    toast({
      title: 'Success',
      description: editingTemplate
        ? 'Recurring expense updated'
        : 'Recurring expense created',
    });
  };

  const handleDelete = () => {
    startTransition(() => {
      fetchTemplates();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {templates.length} active recurring {templates.length === 1 ? 'expense' : 'expenses'}
          </p>
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring Expense
        </Button>
      </div>

      <RecurringTable
        templates={templates}
        isLoading={isLoading || isPending}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <RecurringFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingTemplate={editingTemplate}
        onComplete={handleFormComplete}
      />
    </div>
  );
}
