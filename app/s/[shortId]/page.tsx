'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function ShortURLPage() {
  useEffect(() => {
    // Redirect to full share page with hash intact
    const hash = window.location.hash;
    window.location.href = `/split-bills/share${hash}`;
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to event...</p>
      </div>
    </div>
  );
}
