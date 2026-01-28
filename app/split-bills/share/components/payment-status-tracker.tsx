'use client';

import { useState } from 'react';
import type { ShareableEventData } from '@/lib/types/shareable-event';
import { updatePaymentStatusInUrl } from '@/lib/utils/url-compression';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentStatusTrackerProps {
  data: ShareableEventData;
  onStatusUpdate: (data: ShareableEventData) => void;
}

export default function PaymentStatusTracker({ data, onStatusUpdate }: PaymentStatusTrackerProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const togglePaymentStatus = (participantId: string) => {
    const isPaid = data.pd?.includes(participantId) || false;
    const newHash = updatePaymentStatusInUrl(data, participantId, !isPaid);

    // Update URL hash
    window.location.hash = newHash;

    // Update state
    const updatedData = { ...data };
    if (!isPaid) {
      updatedData.pd = [...(updatedData.pd || []), participantId];
    } else {
      updatedData.pd = (updatedData.pd || []).filter(id => id !== participantId);
    }
    onStatusUpdate(updatedData);

    // Save to localStorage
    try {
      localStorage.setItem(`shareable-event-${newHash.substring(0, 8)}`, JSON.stringify(updatedData));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }

    toast({
      title: isPaid ? 'Marked as unpaid' : 'Marked as paid',
      description: 'Share the updated link to show payment status to others.',
    });
  };

  const copyUpdatedLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'Link copied',
        description: 'Share this link to show current payment status.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually from the address bar.',
        variant: 'destructive',
      });
    }
  };

  const shareLink = async () => {
    const url = window.location.href;
    const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
    if (canShare) {
      try {
        await navigator.share({
          title: data.n,
          text: `Payment status for ${data.n}`,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copy
      copyUpdatedLink();
    }
  };

  const paidCount = data.pd?.length || 0;
  const totalCount = data.p.length;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Payment Status</h2>
          <p className="text-sm text-muted-foreground">
            {paidCount} of {totalCount} participants paid
          </p>
        </div>
        <Badge variant="secondary">
          {paidCount}/{totalCount}
        </Badge>
      </div>

      <div className="mb-4 space-y-2">
        {data.p.map((participant) => {
          const isPaid = data.pd?.includes(participant.i) || false;

          return (
            <div
              key={participant.i}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div className="flex items-center gap-3">
                {isPaid ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">{participant.n}</span>
                {isPaid && <Badge variant="secondary" className="text-xs">Paid</Badge>}
              </div>
              <Button
                variant={isPaid ? 'outline' : 'default'}
                size="sm"
                onClick={() => togglePaymentStatus(participant.i)}
              >
                {isPaid ? 'Mark Unpaid' : 'Mark as Paid'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="space-y-2">
        <Button variant="outline" className="w-full" onClick={copyUpdatedLink}>
          <Copy className="mr-2 h-4 w-4" />
          {copied ? 'Copied!' : 'Copy Updated Link'}
        </Button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button variant="outline" className="w-full" onClick={shareLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Share Updated Link
          </Button>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Payment status is tracked in the URL. Share the updated link to show payment status to other participants.
        Status is not synchronized automatically - each viewer tracks independently.
      </p>
    </Card>
  );
}
