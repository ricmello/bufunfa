'use client';

import { Check } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#64748b', // slate
  '#6b7280', // gray
  '#78716c', // stone
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="h-6 w-6 rounded border"
          style={{ backgroundColor: value }}
        />
        <span className="text-sm font-medium">{value}</span>
      </div>
      <div className="grid grid-cols-10 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            className="h-8 w-8 rounded border hover:scale-110 transition-transform relative"
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
            type="button"
          >
            {value === color && (
              <Check className="h-4 w-4 text-white absolute inset-0 m-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
