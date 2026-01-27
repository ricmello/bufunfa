'use client';

import { useMemo, useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Participant } from '@/lib/types/split-event';
import { calculateSplits, calculateSettlements } from '@/lib/utils/split-calculator';

interface SplitsCalculationSectionProps {
  participants: Participant[];
  totalAmount: number;
}

export function SplitsCalculationSection({
  participants,
  totalAmount,
}: SplitsCalculationSectionProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const calculations = useMemo(
    () => calculateSplits(participants, totalAmount),
    [participants, totalAmount]
  );

  const settlements = useMemo(
    () => calculateSettlements(calculations),
    [calculations]
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const handleCopySettlements = async () => {
    if (settlements.length === 0) {
      toast.info('No settlements to copy');
      return;
    }

    const text = settlements
      .map((s) => `${s.from} pays ${s.to}: ${formatCurrency(s.amount)}`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(text);
      toast.success('Settlements copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleCopySettlement = async (index: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      console.error('Error copying to clipboard:', error);
    }
  };

  const baseShare = totalAmount > 0 && participants.length > 0
    ? totalAmount / calculations.reduce((sum, c) => sum + c.weight, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Split Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Weights</p>
              <p className="text-2xl font-bold">
                {calculations.reduce((sum, c) => sum + c.weight, 0).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Base Share (per 1.0 weight)</p>
              <p className="text-2xl font-bold">{formatCurrency(baseShare)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Participants Calculations */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Shares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calculations.map((calc) => (
                  <TableRow key={calc.participantId}>
                    <TableCell className="font-medium">{calc.name}</TableCell>
                    <TableCell>{calc.weight.toFixed(1)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calc.share)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(calc.amountPaid)}
                    </TableCell>
                    <TableCell className="text-right">
                      {calc.balance > 0.01 ? (
                        <Badge variant="secondary" className="font-mono">
                          +{formatCurrency(calc.balance)}
                        </Badge>
                      ) : calc.balance < -0.01 ? (
                        <Badge variant="destructive" className="font-mono">
                          {formatCurrency(calc.balance)}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-mono">
                          {formatCurrency(0)}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Balance: Positive = owed money (green), Negative = owes money (red), Zero = settled
          </p>
        </CardContent>
      </Card>

      {/* Settlements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>Settlements (Who Owes Whom)</CardTitle>
          {settlements.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleCopySettlements}>
              <Copy className="h-4 w-4 mr-2" />
              Copy All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {settlements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {totalAmount === 0
                ? 'No receipts added yet. Add receipts to see settlements.'
                : 'All balanced! No settlements needed.'}
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((settlement, index) => {
                const text = `${settlement.from} pays ${settlement.to}: ${formatCurrency(settlement.amount)}`;
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-sm">
                        <span className="font-medium">{settlement.from}</span>
                        <span className="text-muted-foreground"> pays </span>
                        <span className="font-medium">{settlement.to}</span>
                      </div>
                      <Badge variant="default" className="font-mono">
                        {formatCurrency(settlement.amount)}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopySettlement(index, text)}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
