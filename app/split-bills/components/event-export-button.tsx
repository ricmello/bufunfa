'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportEventsToCSV } from '@/lib/actions/split-events';
import type { EventFilters } from '@/lib/types/split-event';

interface EventExportButtonProps {
  filters: EventFilters;
}

export function EventExportButton({ filters }: EventExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = await exportEventsToCSV(filters);

      if (result.success && result.csv) {
        // Create and download CSV file
        const blob = new Blob([result.csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `split-bills-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Events exported successfully');
      } else {
        toast.error(result.error || 'Failed to export events');
      }
    } catch (error) {
      toast.error('An error occurred while exporting');
      console.error('Error exporting events:', error);
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
