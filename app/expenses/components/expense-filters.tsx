'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { getAllCategories } from '@/lib/actions/categories';
import type { Category } from '@/lib/types/category';
import type { ExpenseFilters as ExpenseFiltersType } from '@/lib/actions/expense-mutations';

interface ExpenseFiltersProps {
  filters: ExpenseFiltersType;
  onFilterChange: (filters: Partial<ExpenseFiltersType>) => void;
}

export function ExpenseFilters({
  filters,
  onFilterChange,
}: ExpenseFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const cats = await getAllCategories();
      setCategories(cats);
    };
    fetchCategories();
  }, []);

  const selectedCategory = categories.find(
    (c) => c._id === filters.categoryId
  );

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.categoryId ||
    filters.subcategoryId ||
    filters.amountMin !== undefined ||
    filters.amountMax !== undefined ||
    filters.search ||
    (filters.type && filters.type !== 'all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput || undefined });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFilterChange({
      dateFrom: undefined,
      dateTo: undefined,
      categoryId: undefined,
      subcategoryId: undefined,
      amountMin: undefined,
      amountMax: undefined,
      search: undefined,
      type: 'all',
    });
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by description or merchant..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {/* Forecast Toggle */}
      <div className="flex items-center gap-2">
        <Switch
          id="include-forecasts"
          checked={filters.includeForecast !== false}
          onCheckedChange={(checked) =>
            onFilterChange({ includeForecast: checked })
          }
        />
        <Label htmlFor="include-forecasts" className="text-sm cursor-pointer">
          Show Forecasts
        </Label>
      </div>

      {/* Advanced Filters Toggle */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Date From
              </label>
              <Input
                type="date"
                value={
                  filters.dateFrom
                    ? new Date(filters.dateFrom).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onFilterChange({
                    dateFrom: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Date To</label>
              <Input
                type="date"
                value={
                  filters.dateTo
                    ? new Date(filters.dateTo).toISOString().split('T')[0]
                    : ''
                }
                onChange={(e) =>
                  onFilterChange({
                    dateTo: e.target.value
                      ? new Date(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Category and Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Category
              </label>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) =>
                  onFilterChange({
                    categoryId: value === 'all' ? undefined : value,
                    subcategoryId: undefined, // Reset subcategory
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id!}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Subcategory
              </label>
              <Select
                value={filters.subcategoryId || 'all'}
                onValueChange={(value) =>
                  onFilterChange({
                    subcategoryId: value === 'all' ? undefined : value,
                  })
                }
                disabled={!selectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {selectedCategory?.subcategories.map((sub: { _id: string; name: string }) => (
                    <SelectItem key={sub._id} value={sub._id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Min Amount
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMin ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    amountMin: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                Max Amount
              </label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={filters.amountMax ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    amountMax: e.target.value
                      ? parseFloat(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select
              value={filters.type || 'all'}
              onValueChange={(value) =>
                onFilterChange({
                  type: value as 'expense' | 'credit' | 'all',
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expenses Only</SelectItem>
                <SelectItem value="credit">Credits Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
