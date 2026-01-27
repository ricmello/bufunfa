'use client';

import { useState, useEffect } from 'react';
import { EventDetailClient } from './event-detail-client';
import { getEventById } from '@/lib/actions/split-events';
import type { SplitEvent } from '@/lib/types/split-event';

interface EventDetailWrapperProps {
  initialEvent: SplitEvent;
}

export function EventDetailWrapper({ initialEvent }: EventDetailWrapperProps) {
  const [event, setEvent] = useState<SplitEvent>(initialEvent);

  const handleRefresh = async () => {
    const result = await getEventById(event._id!);
    if (result.success && result.event) {
      setEvent(result.event);
    }
  };

  return <EventDetailClient event={event} onRefresh={handleRefresh} />;
}
