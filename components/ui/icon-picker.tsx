'use client';

import { useState } from 'react';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import * as LucideIcons from 'lucide-react';

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

// Popular icons for expense categories
const ICON_OPTIONS = [
  'UtensilsCrossed',
  'Car',
  'ShoppingBag',
  'Tv',
  'FileText',
  'Heart',
  'MoreHorizontal',
  'Home',
  'Zap',
  'Coffee',
  'ShoppingCart',
  'Plane',
  'Briefcase',
  'Gift',
  'Music',
  'Smartphone',
  'Laptop',
  'Book',
  'DollarSign',
  'CreditCard',
  'Wallet',
  'PiggyBank',
  'TrendingUp',
  'Activity',
  'Award',
  'Star',
  'Package',
  'ShoppingBasket',
  'Pizza',
  'Apple',
];

export function IconPicker({ value, onChange }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filteredIcons = ICON_OPTIONS.filter((icon) =>
    icon.toLowerCase().includes(search.toLowerCase())
  );

  const CurrentIcon = (LucideIcons as any)[value] || LucideIcons.HelpCircle;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CurrentIcon className="h-5 w-5" />
        <span className="text-sm font-medium">{value}</span>
      </div>

      <Input
        placeholder="Search icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <ScrollArea className="h-48">
        <div className="grid grid-cols-6 gap-2 pr-4">
          {filteredIcons.map((iconName) => {
            const IconComponent = (LucideIcons as any)[iconName];
            return (
              <button
                key={iconName}
                className={`p-2 rounded hover:bg-muted transition-colors ${
                  value === iconName ? 'bg-muted ring-2 ring-primary' : ''
                }`}
                onClick={() => onChange(iconName)}
                type="button"
                title={iconName}
              >
                <IconComponent className="h-5 w-5" />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
