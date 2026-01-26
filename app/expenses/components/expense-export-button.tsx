'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  exportExpensesToCSV,
  type ExpenseFilters,
} from '@/lib/actions/expense-mutations';

interface ExpenseExportButtonProps {
  filters: ExpenseFilters;
}

export function ExpenseExportButton({ filters }: ExpenseExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportExpensesToCSV(filters);

      if (result.success && result.csv) {
        // Create blob and trigger download
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        // Generate filename with current date
        const date = new Date().toISOString().split('T')[0];
        link.download = `expenses-${date}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Expenses exported successfully');
      } else {
        toast.error(result.error || 'Failed to export expenses');
      }
    } catch (error) {
      toast.error('Failed to export expenses');
      console.error('Error exporting expenses:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={isExporting}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
