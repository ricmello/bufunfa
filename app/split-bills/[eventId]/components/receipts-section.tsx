'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt as ReceiptIcon } from 'lucide-react';
import { ReceiptCard } from './receipt-card';
import { ReceiptUploadDialog } from './receipt-upload-dialog';
import { getReceipts } from '@/lib/actions/receipts';
import type { Receipt } from '@/lib/types/receipt';
import type { Participant } from '@/lib/types/split-event';

interface ReceiptsSectionProps {
  eventId: string;
  participants: Participant[];
  onReceiptsChange: () => void;
}

export function ReceiptsSection({ eventId, participants, onReceiptsChange }: ReceiptsSectionProps) {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReceipts = async () => {
    setIsLoading(true);
    const data = await getReceipts(eventId);
    setReceipts(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReceipts();
  }, [eventId]);

  const handleReceiptChange = async () => {
    await fetchReceipts();
    onReceiptsChange();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptIcon className="h-5 w-5" />
              <CardTitle>Receipts</CardTitle>
              {receipts.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({receipts.length})
                </span>
              )}
            </div>
            <Button onClick={() => setShowUploadDialog(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Receipt
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading receipts...
            </div>
          ) : receipts.length === 0 ? (
            <div className="py-12 text-center">
              <ReceiptIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No receipts yet. Add your first receipt.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setShowUploadDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Receipt
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {receipts.map((receipt) => (
                <ReceiptCard
                  key={receipt._id}
                  receipt={receipt}
                  eventId={eventId}
                  participants={participants}
                  onDelete={handleReceiptChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ReceiptUploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={handleReceiptChange}
        eventId={eventId}
        participants={participants}
      />
    </>
  );
}
