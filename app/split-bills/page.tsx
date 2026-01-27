import { Suspense } from 'react';
import { EventListClient } from './components/event-list-client';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

export default function SplitBillsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Split Bills</h1>
        <p className="text-muted-foreground">
          Manage events and split expenses with friends
        </p>
      </div>

      <Suspense fallback={<SplitBillsPageSkeleton />}>
        <EventListClient />
      </Suspense>
    </div>
  );
}

function SplitBillsPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
