'use client';

import { useEffect, useState } from 'react';
import { decompressEventData } from '@/lib/utils/url-compression';
import type { ShareableEventData } from '@/lib/types/shareable-event';
import ShareEventHeader from './share-event-header';
import ShareParticipants from './share-participants';
import ShareSettlements from './share-settlements';
import PaymentStatusTracker from './payment-status-tracker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function ShareViewClient() {
  const [eventData, setEventData] = useState<ShareableEventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract hash from URL
    const hash = window.location.hash.substring(1); // Remove # prefix

    if (!hash) {
      setError('No data found in URL. The link may be incomplete.');
      setLoading(false);
      return;
    }

    // Decompress event data
    const data = decompressEventData(hash);

    if (!data) {
      setError('Invalid or corrupted share link. Please request a new link from the event host.');
      setLoading(false);
      return;
    }

    setEventData(data);
    setLoading(false);

    // Save to localStorage as backup
    try {
      localStorage.setItem(`shareable-event-${hash.substring(0, 8)}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Failed to load event data'}</AlertDescription>
        </Alert>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          If you continue to have issues, please contact the person who shared this link.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 space-y-6">
        <ShareEventHeader data={eventData} />

        <div className="space-y-6">
          <ShareParticipants data={eventData} />
          <ShareSettlements data={eventData} />

          {eventData.r && eventData.r.length > 0 && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold">Receipts</h2>
              <div className="space-y-3">
                {eventData.r.map((receipt, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="font-medium">{receipt.d}</p>
                      {receipt.m && <p className="text-sm text-muted-foreground">{receipt.m}</p>}
                    </div>
                    <p className="font-semibold">R$ {receipt.a.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <PaymentStatusTracker data={eventData} onStatusUpdate={setEventData} />
        </div>
      </div>

      <footer className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
        <p>Powered by Bufunfa - Privacy-first expense management</p>
        <p className="mt-1">This is a read-only view. Payment status is tracked locally on your device.</p>
      </footer>
    </div>
  );
}
