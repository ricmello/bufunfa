'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Participant } from '@/lib/types/split-event';

interface ParticipantsSectionProps {
  participants: Participant[];
}

export function ParticipantsSection({
  participants,
}: ParticipantsSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell className="font-medium">
                    {participant.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {participant.weight === 1.0 ? 'Couple (1.0)' : 'Single (0.5)'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {participant.isPayer && (
                      <Badge>Payer</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(participant.amountPaid)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
