'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Upload, Settings, FolderKanban, Receipt, Users, Repeat } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'Expenses',
    href: '/expenses',
    icon: Receipt,
  },
  {
    title: 'Recurring Expenses',
    href: '/recurring',
    icon: Repeat,
  },
  {
    title: 'Split Bills',
    href: '/split-bills',
    icon: Users,
  },
  {
    title: 'Import',
    href: '/import',
    icon: Upload,
  },
  {
    title: 'Categories',
    href: '/categories',
    icon: FolderKanban,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
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
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-4 py-2 text-xs text-muted-foreground">
          Privacy-first expense tracking
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
