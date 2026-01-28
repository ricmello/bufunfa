'use client';

import Image from 'next/image';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <Image
              src="/bufunfa.svg"
              alt="Bufunfa Logo"
              width={32}
              height={32}
              className="h-8 w-8"
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Bufunfa</h2>
            <p className="text-xs text-muted-foreground">Expense Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
