'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from './button';
import { Card } from './card';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PIXQRCodeProps {
  payload: string;
  amount: number;
  recipientName: string;
  description: string;
}

export default function PIXQRCode({ payload, amount, recipientName, description }: PIXQRCodeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const copyPIXCode = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: 'PIX code copied',
        description: 'Paste it in your bank app to complete the payment.',
      });
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again or scan the QR code instead.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* QR Code */}
        <div className="shrink-0 rounded-lg bg-white p-3">
          <QRCodeSVG
            value={payload}
            size={160}
            level="M"
            includeMargin
          />
        </div>

        {/* Payment Details */}
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Pay via PIX</p>
            <p className="text-2xl font-bold text-primary">R$ {amount.toFixed(2)}</p>
          </div>

          <div className="space-y-1">
            <div>
              <p className="text-xs text-muted-foreground">Recipient</p>
              <p className="font-medium">{recipientName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="text-sm">{description}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={copyPIXCode}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy PIX Code
              </>
            )}
          </Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Scan the QR code with your bank app or copy the PIX code to complete the payment.
      </p>
    </Card>
  );
}
