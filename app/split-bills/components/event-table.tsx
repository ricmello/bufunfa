'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { deleteEvent } from '@/lib/actions/split-events';
import type { PaginatedEvents, SplitEvent } from '@/lib/types/split-event';

interface EventTableProps {
  data: PaginatedEvents;
  isLoading: boolean;
  onEdit: (event: SplitEvent) => void;
  onRefresh: () => void;
  onPageChange: (page: number) => void;
}

export function EventTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
  onPageChange,
}: EventTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const result = await deleteEvent(deleteId);
      if (result.success) {
        toast.success('Event deleted successfully');
        onRefresh();
      } else {
        toast.error(result.error || 'Failed to delete event');
      }
    } catch (error) {
      toast.error('An error occurred while deleting');
      console.error('Error deleting event:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: SplitEvent['status']) => {
    const variants = {
      open: 'default',
      settled: 'secondary',
      cancelled: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.events.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-card">
        <p className="text-muted-foreground">
          No events found. Create your first event to get started.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.events.map((event) => (
              <TableRow
                key={event._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/split-bills/${event._id}`)}
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{event.name}</div>
                    {event.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {event.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDate(event.eventDate)}</TableCell>
                <TableCell>{getStatusBadge(event.status)}</TableCell>
                <TableCell>{event.participants.length}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(event.totalAmount)}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/split-bills/${event._id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(event)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(event._id!)}
                    >
                      <Trash2 className="h-4 w-4" />
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
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {data.events.length} of {data.totalCount} events
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
            <span className="flex items-center px-3 text-sm">
              Page {data.page} of {data.totalPages}
            </span>
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
