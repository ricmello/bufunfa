'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface ImportConfirmationProps {
  isOpen: boolean;
  rowCount: number;
  onConfirm: (month: number, year: number) => void;
  onCancel: () => void;
  isImporting?: boolean;
  initialMonth?: number;
  initialYear?: number;
  autoDetected?: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function ImportConfirmation({
  isOpen,
  rowCount,
  onConfirm,
  onCancel,
  isImporting = false,
  initialMonth,
  initialYear,
  autoDetected = false,
}: ImportConfirmationProps) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(
    initialMonth?.toString() || (currentDate.getMonth() + 1).toString()
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    initialYear?.toString() || currentDate.getFullYear().toString()
  );

  // Sync state with props when they change
  useEffect(() => {
    if (initialMonth !== undefined) {
      setSelectedMonth(initialMonth.toString());
    }
  }, [initialMonth]);

  useEffect(() => {
    if (initialYear !== undefined) {
      setSelectedYear(initialYear.toString());
    }
  }, [initialYear]);

  const handleConfirm = () => {
    onConfirm(parseInt(selectedMonth), parseInt(selectedYear));
  };

  // Generate year options (current year ± 2 years)
  const currentYear = currentDate.getFullYear();
  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2,
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Import</DialogTitle>
          <DialogDescription>
            You are about to import <strong>{rowCount}</strong> transactions.
            {autoDetected ? (
              <span className="block mt-2 text-primary font-medium">
                📅 Statement period detected from filename
              </span>
            ) : (
              <span className="block mt-2">Please specify the statement period.</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="month">Statement Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="year">Statement Year</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
