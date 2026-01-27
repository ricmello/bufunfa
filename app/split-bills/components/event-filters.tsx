'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import type { EventFilters as EventFiltersType } from '@/lib/types/split-event';

interface EventFiltersProps {
  filters: EventFiltersType;
  onFilterChange: (filters: Partial<EventFiltersType>) => void;
  isLoading?: boolean;
}

export function EventFilters({
  filters,
  onFilterChange,
  isLoading,
}: EventFiltersProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.search ||
    (filters.status && filters.status !== 'all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput || undefined });
  };

  const handleClearFilters = () => {
    setSearchInput('');
    onFilterChange({
      dateFrom: undefined,
      dateTo: undefined,
      search: undefined,
      status: 'all',
    });
  };

  return (
    <div className="space-y-4 bg-card p-4 rounded-lg border">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          Search
        </Button>
      </form>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFilterChange({ status: value as EventFiltersType['status'] })
          }
          disabled={isLoading}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" disabled={isLoading}>
            <Filter className="h-4 w-4 mr-2" />
            {isAdvancedOpen ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date From</label>
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
                disabled={isLoading}
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date To</label>
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
                disabled={isLoading}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
