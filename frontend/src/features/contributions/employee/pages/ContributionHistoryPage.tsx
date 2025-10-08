import { useMemo, useState } from 'react';
import { Calendar } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from '@tanstack/react-table';
import type { EmployeeOverview } from '@/features/dashboard/employee/types/employeeOverview';
import { periodOptions } from '../data/periodOptions';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { EmployeeContributionsTable } from '../../hr/components/EmployeeContributionsTable';
import { useDateRangeFilter } from '@/shared/hooks/useDateRangeFilter';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import type {
  Contribution,
  ContributionPeriod,
  ContributionSummary,
} from '../../shared/types/contributions';
import {
  fetchEmployeeContributions,
  fetchEmployeeContributionsSummary,
} from '../services/employeeContributionsService';
import { fetchEmployeeOverview } from '@/features/dashboard/employee/services/employeeService';
import { useContributionsExport } from '../../hr/hooks/useContributionsExport';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { ContributionsProvider } from '../../hr/components/ContributionsProvider';
import { contributionsColumns } from '../components/ContributionColumns';
import { ContributionStats } from '../components/ContributionStats';

export type EmployeeMetadata = Omit<EmployeeOverview['employee'], 'id'>;

export default function ContributionHistoryPage() {
  const { data, loading, error } = useMultiFetch<{
    contributions: Contribution[];
    summary: ContributionSummary;
    overview: EmployeeOverview;
  }>(async () => {
    const [constributionsRes, summarRes, overviewRes] = await Promise.all([
      fetchEmployeeContributions('all'),
      fetchEmployeeContributionsSummary('all'),
      fetchEmployeeOverview(),
    ]);

    return {
      contributions: constributionsRes,
      summary: summarRes,
      overview: overviewRes,
    };
  });

  const contributions = data?.contributions;
  const summary = data?.summary;
  const overview = data?.overview;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters);

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  const { handleExport } = useContributionsExport({
    dateRange: {
      start: dateRange.start,
      end: dateRange.end ?? new Date().toLocaleDateString(),
    },
  });

  const table = useReactTable({
    data: contributions ?? [],
    columns: contributionsColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: handlePaginationChange,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
  });

  if (loading) return <LoadingSpinner text='Loading contributions...' />;
  if (error) return <DataError message='Unable to fetch contributions' />;

  return (
    <ContributionsProvider>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'>
          <div className='space-y-1'>
            <h1 className='text-2xl font-bold tracking-tight'>
              Contribution History
            </h1>
            <p className='text-muted-foreground'>
              Track your provident fund contributions and growth over time
            </p>
          </div>
        </div>

        {summary && <ContributionStats summary={summary} />}
        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>
              Detailed Contribution History
            </CardTitle>
            <CardDescription>
              Monthly breakdown of your contributions for the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeContributionsTable table={table} />
          </CardContent>
        </Card>
      </div>
    </ContributionsProvider>
  );
}
