import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getEventById } from '@/lib/actions/split-events';
import { EventDetailWrapper } from './components/event-detail-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const dynamic = 'force-dynamic';

interface EventDetailPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { eventId } = await params;
  const result = await getEventById(eventId);

  if (!result.success || !result.event) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetailWrapper initialEvent={result.event} />
      </Suspense>
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
