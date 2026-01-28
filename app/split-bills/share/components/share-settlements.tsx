'use client';

import type { ShareableEventData } from '@/lib/types/shareable-event';
import { calculateSplits, calculateSettlements } from '@/lib/utils/split-calculator';
import { generatePIXPayload } from '@/lib/utils/pix-generator';
import { Card } from '@/components/ui/card';
import PIXQRCode from '@/components/ui/pix-qr-code';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ShareSettlementsProps {
  data: ShareableEventData;
}

export default function ShareSettlements({ data }: ShareSettlementsProps) {
  const totalAmount = data.r?.reduce((sum, r) => sum + r.a, 0) || 0;

  // Transform shareable participants to match Participant type for calculation
  const participantsForCalc = data.p.map(p => ({
    id: p.i,
    name: p.n,
    weight: p.w,
    amountPaid: p.ap,
    isPayer: false,
  }));

  const calculations = calculateSplits(participantsForCalc, totalAmount);
  const settlements = calculateSettlements(calculations);

  if (settlements.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Settlements</h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>All balances are settled. No payments needed!</AlertDescription>
        </Alert>
      </Card>
    );
  }

  const hasPIX = data.px && data.pn;

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Settlements</h2>

      {!hasPIX && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            PIX payment details not configured. Please contact the event host for payment instructions.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {settlements.map((settlement, index) => {
          // Generate PIX QR code if PIX is configured
          let pixPayload: string | null = null;
          if (hasPIX) {
            try {
              pixPayload = generatePIXPayload({
                pixKey: data.px!,
                recipientName: data.pn!,
                amount: settlement.amount,
                description: `${data.n} - ${settlement.from} pays ${settlement.to}`,
              });
            } catch (error) {
              console.error('Failed to generate PIX payload:', error);
            }
          }

          return (
            <div key={index} className="border-b pb-6 last:border-0">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">
                    {settlement.from} pays {settlement.to}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    R$ {settlement.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {pixPayload && (
                <div className="mt-4">
                  <PIXQRCode
                    payload={pixPayload}
                    amount={settlement.amount}
                    recipientName={data.pn!}
                    description={`Payment for ${data.n}`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>These settlement transactions minimize the number of payments needed.</p>
        {hasPIX && <p>Scan the QR code with your bank app to complete the payment via PIX.</p>}
      </div>
    </Card>
  );
}
