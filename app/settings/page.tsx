import { Suspense } from 'react';
import { DangerZone } from './components/danger-zone';
import { DataStats } from './components/data-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="container max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application preferences and data
        </p>
      </div>

      <div className="space-y-6">
        <Suspense fallback={<LoadingSkeleton />}>
          <DataStats />
        </Suspense>

        <DangerZone />
      </div>
    </div>
  );
}
