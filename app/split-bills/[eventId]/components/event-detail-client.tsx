'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SplitEvent } from '@/lib/types/split-event';
import { ParticipantsSection } from './participants-section';
import { SplitsCalculationSection } from './splits-calculation-section';
import { ReceiptsSection } from './receipts-section';
import { ShareButton } from './share-button';

interface EventDetailClientProps {
  event: SplitEvent;
  onRefresh: () => void;
}

export function EventDetailClient({ event, onRefresh }: EventDetailClientProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/split-bills')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              {getStatusBadge(event.status)}
            </div>
            {event.description && (
              <p className="text-muted-foreground mt-1">{event.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ShareButton event={event} onRefresh={onRefresh} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(event.eventDate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{event.participants.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total weight: {event.totalWeights.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(event.totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {event.totalAmount === 0 ? 'No receipts yet' : 'From receipts'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts */}
      <ReceiptsSection
        eventId={event._id!}
        participants={event.participants}
        onReceiptsChange={onRefresh}
      />

      {/* Participants */}
      <ParticipantsSection participants={event.participants} />

      {/* Splits Calculation */}
      <SplitsCalculationSection
        participants={event.participants}
        totalAmount={event.totalAmount}
      />
    </div>
  );
}
