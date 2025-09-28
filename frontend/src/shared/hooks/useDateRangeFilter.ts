// hooks/useDateRangeFilter.ts
import { useState, useEffect } from 'react';
import type { ColumnFiltersState } from '@tanstack/react-table';

export function useDateRangeFilter(
  columnFilters: ColumnFiltersState,
  filterId = 'contribution_date'
) {
  const [dateRange, setDateRange] = useState<{
    start?: string;
    end?: string;
  }>({});

  useEffect(() => {
    const dateFilter = columnFilters.find(filter => filter.id === filterId);

    if (dateFilter?.value && typeof dateFilter.value === 'object') {
      setDateRange(dateFilter.value as { start?: string; end?: string });
    } else {
      setDateRange({});
    }
  }, [columnFilters, filterId]);

  return dateRange;
}
