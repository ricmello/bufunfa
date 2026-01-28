'use client';

import { useState, useEffect, useTransition } from 'react';
import { buildShareableUrl, validateUrlSize } from '@/lib/utils/url-compression';
import { getReceipts } from '@/lib/actions/receipts';
import { toggleReceiptSharing } from '@/lib/actions/split-events';
import type { SplitEvent } from '@/lib/types/split-event';
import type { Receipt } from '@/lib/types/receipt';
import type { ShareableEventData, ShareableParticipant, ShareableReceipt } from '@/lib/types/shareable-event';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Share2, Copy, Check, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import { PIXSettingsDialog } from './pix-settings-dialog';

interface ShareButtonProps {
  event: SplitEvent;
  onRefresh: () => void;
}

export function ShareButton({ event, onRefresh }: ShareButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [includeReceipts, setIncludeReceipts] = useState(event.includeReceipts ?? true);
  const [shareData, setShareData] = useState<{
    fullUrl: string;
    shortUrl: string;
    size: number;
    warning?: string;
  } | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedShort, setCopiedShort] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadReceiptsAndGenerateUrl();
    }
  }, [open, includeReceipts]);

  const loadReceiptsAndGenerateUrl = async () => {
    setLoading(true);
    try {
      // Fetch receipts
      const fetchedReceipts = await getReceipts(event._id!);
      setReceipts(fetchedReceipts);

      // Build shareable data
      const shareableData = buildShareableData(event, fetchedReceipts, includeReceipts);

      // Get base URL
      const baseUrl = window.location.origin;

      // Generate URLs
      const { fullUrl, shortUrl, compressedSize } = buildShareableUrl(shareableData, baseUrl);

      // Validate size
      const validation = validateUrlSize(fullUrl);

      setShareData({
        fullUrl,
        shortUrl,
        size: compressedSize,
        warning: validation.warning,
      });
    } catch (error) {
      console.error('Failed to generate share URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate shareable link. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildShareableData = (
    event: SplitEvent,
    receipts: Receipt[],
    includeReceiptsFlag: boolean
  ): ShareableEventData => {
    // Transform participants
    const participants: ShareableParticipant[] = event.participants.map((p) => ({
      i: p.id,
      n: p.name,
      w: p.weight,
      ap: p.amountPaid,
    }));

    // Transform receipts if included
    let shareableReceipts: ShareableReceipt[] | undefined;
    if (includeReceiptsFlag && receipts.length > 0) {
      shareableReceipts = receipts.map((r) => ({
        d: r.description,
        m: r.merchantName,
        a: r.amount,
        pb: [r.paidBy], // Array of participant IDs who paid
      }));
    }

    return {
      n: event.name,
      d: event.description,
      dt: event.eventDate.toISOString(),
      p: participants,
      r: shareableReceipts,
      px: event.pixKey || undefined,
      pn: event.pixName || undefined,
    };
  };

  const toggleIncludeReceipts = () => {
    const newValue = !includeReceipts;
    setIncludeReceipts(newValue);

    // Save preference to database
    startTransition(async () => {
      await toggleReceiptSharing(event._id!, newValue);
    });
  };

  const copyUrl = async (url: string, type: 'full' | 'short') => {
    try {
      await navigator.clipboard.writeText(url);
      if (type === 'full') {
        setCopiedFull(true);
        setTimeout(() => setCopiedFull(false), 2000);
      } else {
        setCopiedShort(true);
        setTimeout(() => setCopiedShort(false), 2000);
      }
      toast({
        title: 'Link copied',
        description: 'Share this link with event participants.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the URL manually.',
        variant: 'destructive',
      });
    }
  };

  const shareNative = async () => {
    const canShare = typeof navigator !== 'undefined' && 'share' in navigator;
    if (canShare && shareData) {
      try {
        await navigator.share({
          title: event.name,
          text: `View split bill for ${event.name}`,
          url: shareData.shortUrl,
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share Event
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Event</DialogTitle>
            <DialogDescription>
              Create a shareable link for this split bill event. Recipients don't need an account to view it.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* Receipt Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="include-receipts" className="text-base">
                    Include receipt details
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show receipt amounts and descriptions in the shared link
                  </p>
                </div>
                <Switch
                  id="include-receipts"
                  checked={includeReceipts}
                  onCheckedChange={toggleIncludeReceipts}
                  disabled={isPending}
                />
              </div>

              {/* Size Warning */}
              {shareData?.warning && (
                <Alert variant="default">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{shareData.warning}</AlertDescription>
                </Alert>
              )}

              {/* URLs */}
              {shareData && (
                <div className="space-y-4">
                  {/* Short URL */}
                  <div className="space-y-2">
                    <Label>Short URL (recommended)</Label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareData.shortUrl}
                        readOnly
                        className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyUrl(shareData.shortUrl, 'short')}
                      >
                        {copiedShort ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Full URL */}
                  <div className="space-y-2">
                    <Label>Full URL</Label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareData.fullUrl}
                        readOnly
                        className="flex-1 rounded-md border bg-muted px-3 py-2 text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyUrl(shareData.fullUrl, 'full')}
                      >
                        {copiedFull ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="space-y-2">
                    <Label>QR Code</Label>
                    <div className="flex justify-center rounded-lg border bg-white p-4">
                      <QRCodeSVG value={shareData.shortUrl} size={200} level="M" includeMargin />
                    </div>
                    <p className="text-center text-xs text-muted-foreground">
                      Scan with a phone camera to open the shared link
                    </p>
                  </div>

                  {/* Native Share */}
                  {typeof navigator !== 'undefined' && 'share' in navigator && (
                    <Button variant="outline" className="w-full" onClick={shareNative}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share via...
                    </Button>
                  )}

                  {/* Info */}
                  <Alert>
                    <AlertDescription className="text-xs">
                      <strong>Privacy:</strong> All data is embedded in the URL. No backend storage. Recipients can track payments locally, but updates won't sync automatically.
                    </AlertDescription>
                  </Alert>

                  {/* Size Info */}
                  <p className="text-xs text-muted-foreground text-center">
                    Compressed size: {shareData.size} bytes
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PIXSettingsDialog
        eventId={event._id!}
        currentPixKey={event.pixKey}
        currentPixName={event.pixName}
        onUpdate={onRefresh}
      />
    </>
  );
}
