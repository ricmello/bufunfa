'use client';

import type { ShareableEventData, ShareableParticipant } from '@/lib/types/shareable-event';
import { calculateSplits } from '@/lib/utils/split-calculator';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ShareParticipantsProps {
  data: ShareableEventData;
}

export default function ShareParticipants({ data }: ShareParticipantsProps) {
  const totalAmount = data.r?.reduce((sum, r) => sum + r.a, 0) || 0;

  // Transform shareable participants to match Participant type for calculation
  const participantsForCalc = data.p.map(p => ({
    id: p.i,
    name: p.n,
    weight: p.w,
    amountPaid: p.ap,
    isPayer: false, // Not needed for calculation
  }));

  const calculations = calculateSplits(participantsForCalc, totalAmount);

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-lg font-semibold">Participants</h2>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Weight</TableHead>
              <TableHead className="text-right">Share</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculations.map((calc) => {
              const isPaid = data.pd?.includes(calc.participantId) || false;

              return (
                <TableRow key={calc.participantId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {calc.name}
                      {isPaid && <Badge variant="secondary" className="text-xs">Paid</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{calc.weight.toFixed(1)}</TableCell>
                  <TableCell className="text-right">R$ {calc.share.toFixed(2)}</TableCell>
                  <TableCell className="text-right">R$ {calc.amountPaid.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        calc.balance > 0.01
                          ? 'text-green-600 dark:text-green-400'
                          : calc.balance < -0.01
                          ? 'text-red-600 dark:text-red-400'
                          : ''
                      }
                    >
                      R$ {calc.balance.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Weight: 1.0 = full share, 0.5 = half share</p>
        <p>Balance: Positive = owed money, Negative = owes money</p>
      </div>
    </Card>
  );
}
