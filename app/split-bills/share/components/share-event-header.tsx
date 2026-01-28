'use client';

import type { ShareableEventData } from '@/lib/types/shareable-event';
import { Calendar, Users, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ShareEventHeaderProps {
  data: ShareableEventData;
}

export default function ShareEventHeader({ data }: ShareEventHeaderProps) {
  const totalAmount = data.r?.reduce((sum, r) => sum + r.a, 0) || 0;
  const eventDate = new Date(data.dt);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">{data.n}</h1>
        {data.d && <p className="mt-2 text-muted-foreground">{data.d}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Event Date</p>
              <p className="font-semibold">
                {eventDate.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Participants</p>
              <p className="font-semibold">{data.p.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold">R$ {totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
