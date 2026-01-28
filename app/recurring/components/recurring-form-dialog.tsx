'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getAllCategories } from '@/lib/actions/categories';
import { createRecurringExpense, updateRecurringExpense } from '@/lib/actions/recurring-expenses';
import type { RecurringExpenseWithCategory, RecurringExpenseFormData } from '@/lib/types/recurring-expense';
import type { Category } from '@/lib/types/category';

interface RecurringFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: RecurringExpenseWithCategory | null;
  onComplete: () => void;
}

export function RecurringFormDialog({
  open,
  onOpenChange,
  editingTemplate,
  onComplete,
}: RecurringFormDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'weekly'>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [dayOfWeek, setDayOfWeek] = useState('0');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [forecastMonths, setForecastMonths] = useState('6');
  const [merchantName, setMerchantName] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      const data = await getAllCategories();
      setCategories(data);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (editingTemplate) {
      setDescription(editingTemplate.description);
      setAmount(Math.abs(editingTemplate.amount).toString());
      setCategoryId(editingTemplate.categoryId);
      setSubcategoryId(editingTemplate.subcategoryId);
      setFrequency(editingTemplate.frequency);
      setDayOfMonth(editingTemplate.dayOfMonth?.toString() || '1');
      setDayOfWeek(editingTemplate.dayOfWeek?.toString() || '0');
      setStartDate(new Date(editingTemplate.startDate));
      setEndDate(editingTemplate.endDate ? new Date(editingTemplate.endDate) : undefined);
      setForecastMonths(editingTemplate.forecastMonths.toString());
      setMerchantName(editingTemplate.merchantName || '');
    } else {
      // Reset form for new entry
      setDescription('');
      setAmount('');
      setCategoryId('');
      setSubcategoryId('');
      setFrequency('monthly');
      setDayOfMonth('1');
      setDayOfWeek('0');
      setStartDate(new Date());
      setEndDate(undefined);
      setForecastMonths('6');
      setMerchantName('');
    }
  }, [editingTemplate, open]);

  const selectedCategory = categories.find((cat) => cat._id === categoryId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount || !categoryId || !subcategoryId) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    const formData: RecurringExpenseFormData = {
      description,
      amount: -Math.abs(parseFloat(amount)), // Negative for expenses
      categoryId,
      subcategoryId,
      frequency,
      startDate,
      endDate,
      dayOfMonth: frequency === 'monthly' ? parseInt(dayOfMonth) : undefined,
      dayOfWeek: frequency === 'weekly' ? parseInt(dayOfWeek) : undefined,
      forecastMonths: parseInt(forecastMonths),
      merchantName: merchantName || undefined,
      tags: [],
    };

    try {
      let result;
      if (editingTemplate) {
        result = await updateRecurringExpense(editingTemplate._id!, formData);
      } else {
        result = await createRecurringExpense(formData);
      }

      if (result.success) {
        onComplete();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save recurring expense',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save recurring expense',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingTemplate ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Rent, Netflix Subscription"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter positive value (will be saved as expense)
            </p>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={categoryId} onValueChange={(value) => {
              setCategoryId(value);
              setSubcategoryId(''); // Reset subcategory
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id!}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory *</Label>
            <Select
              value={subcategoryId}
              onValueChange={setSubcategoryId}
              disabled={!categoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subcategory" />
              </SelectTrigger>
              <SelectContent>
                {selectedCategory?.subcategories.map((sub) => (
                  <SelectItem key={sub._id} value={sub._id}>
                    {sub.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Merchant Name */}
          <div className="space-y-2">
            <Label htmlFor="merchantName">Merchant Name (Optional)</Label>
            <Input
              id="merchantName"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              placeholder="e.g., Netflix, Landlord"
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency *</Label>
            <RadioGroup value={frequency} onValueChange={(value: any) => setFrequency(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="font-normal cursor-pointer">
                  Monthly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="font-normal cursor-pointer">
                  Weekly
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Day of Month (Monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfMonth">Day of Month *</Label>
              <Select value={dayOfMonth} onValueChange={setDayOfMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <SelectItem key={day} value={day.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                For months with fewer days (e.g., Feb), the last day will be used
              </p>
            </div>
          )}

          {/* Day of Week (Weekly) */}
          {frequency === 'weekly' && (
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week *</Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sunday</SelectItem>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="2">Tuesday</SelectItem>
                  <SelectItem value="3">Wednesday</SelectItem>
                  <SelectItem value="4">Thursday</SelectItem>
                  <SelectItem value="5">Friday</SelectItem>
                  <SelectItem value="6">Saturday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !startDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !endDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'No end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEndDate(undefined)}
              >
                Clear end date
              </Button>
            )}
          </div>

          {/* Forecast Months */}
          <div className="space-y-2">
            <Label htmlFor="forecastMonths">Forecast Months *</Label>
            <Input
              id="forecastMonths"
              type="number"
              min="1"
              max="24"
              value={forecastMonths}
              onChange={(e) => setForecastMonths(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of months to generate forecasts ahead (1-24)
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
