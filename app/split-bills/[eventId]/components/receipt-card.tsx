'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Trash2, Store, Receipt as ReceiptIcon } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import { deleteReceipt } from '@/lib/actions/receipts';
import type { Receipt } from '@/lib/types/receipt';
import type { Participant } from '@/lib/types/split-event';

interface ReceiptCardProps {
  receipt: Receipt;
  eventId: string;
  participants: Participant[];
  onDelete: () => void;
}

export function ReceiptCard({ receipt, eventId, participants, onDelete }: ReceiptCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const payer = participants.find((p) => p.id === receipt.paidBy);

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteReceipt(receipt._id!, eventId);

    if (result.success) {
      toast.success('Receipt deleted successfully');
      onDelete();
    } else {
      toast.error(result.error || 'Failed to delete receipt');
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {receipt.imageUrl ? (
            <div
              className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
              onClick={() => setShowImageModal(true)}
            >
              <Image
                src={receipt.imageUrl}
                alt={receipt.description}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center bg-muted">
              <ReceiptIcon className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}

          <div className="space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="font-semibold">{receipt.description}</h3>
                {receipt.merchantName && (
                  <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    <Store className="h-3 w-3" />
                    <span>{receipt.merchantName}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(receipt.amount)}
                </div>
              </div>
            </div>

            {payer && (
              <Badge variant="secondary" className="text-xs">
                Paid by: {payer.name}
              </Badge>
            )}
          </div>
        </CardContent>

        <CardFooter className="border-t p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Receipt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this receipt? This action cannot be undone and will
              update the split calculations.
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

      {showImageModal && receipt.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative h-full w-full p-4">
            <Image
              src={receipt.imageUrl}
              alt={receipt.description}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
