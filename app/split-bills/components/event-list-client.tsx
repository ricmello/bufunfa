'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getEvents } from '@/lib/actions/split-events';
import type { EventFilters, PaginatedEvents, SplitEvent } from '@/lib/types/split-event';
import { EventFilters as EventFiltersComponent } from './event-filters';
import { EventTable } from './event-table';
import { EventFormDialog } from './event-form-dialog';
import { EventExportButton } from './event-export-button';

export function EventListClient() {
  const [data, setData] = useState<PaginatedEvents>({
    events: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<EventFilters>({
    page: 1,
    pageSize: 20,
    status: 'all',
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SplitEvent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await getEvents(filters);
        setData(result);
      } catch (error) {
        toast.error('Failed to load events');
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<EventFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const result = await getEvents(filters);
        setData(result);
        toast.success('Events refreshed');
      } catch (error) {
        toast.error('Failed to refresh events');
        console.error('Error refreshing events:', error);
      }
    });
  };

  const handleEdit = (event: SplitEvent) => {
    setEditingEvent(event);
  };

  const handleCloseDialog = () => {
    setIsAddDialogOpen(false);
    setEditingEvent(null);
  };

  const handleSaveSuccess = () => {
    handleCloseDialog();
    handleRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex justify-between items-center gap-4">
        <EventExportButton filters={filters} />
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Event
        </Button>
      </div>

      {/* Filters */}
      <EventFiltersComponent
        filters={filters}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
      />

      {/* Table */}
      <EventTable
        data={data}
        isLoading={isLoading}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
      />

      {/* Create/Edit Dialog */}
      <EventFormDialog
        open={isAddDialogOpen || editingEvent !== null}
        onClose={handleCloseDialog}
        onSuccess={handleSaveSuccess}
        editingEvent={editingEvent}
      />
    </div>
  );
}
