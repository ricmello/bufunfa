'use client';

import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { PublicHeader } from './public-header';
import { SidebarInset, SidebarTrigger } from './ui/sidebar';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute =
    pathname.startsWith('/split-bills/share') ||
    pathname.startsWith('/s/') ||
    pathname.startsWith('/auth/');

  if (isPublicRoute) {
    // Minimal layout for public pages
    return (
      <div className="flex min-h-screen w-full flex-col">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // Full sidebar layout for authenticated pages
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex-1 p-6">
          {children}
        </div>
      </SidebarInset>
    </>
  );
}
