import { useCallback, useState } from 'react';
import { AlertCircle, FileText, RefreshCw } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { EmployeeContributionsTable } from '../../hr/components/EmployeeContributionsTable';
import { useDateRangeFilter } from '@/shared/hooks/useDateRangeFilter';
import { useTablePagination } from '@/shared/hooks/useTablePagination';

import {
  fetchEmployeeContributions,
  fetchEmployeeContributionsSummary,
} from '../services/employeeContributionsService';
import { fetchEmployeeOverview } from '@/features/dashboard/employee/services/employeeService';
import { ContributionsProvider } from '../../hr/components/ContributionsProvider';
import { contributionsColumns } from '../components/ContributionColumns';
import { ContributionStats } from '../components/ContributionStats';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { Button } from '@/components/ui/button';
import { useEMPContributionsExport } from '../hooks/useEMPContributionsExport';
import { ExportDropdown } from '@/shared/components/ExportDropdown';

export type EmployeeMetadata = Omit<EmployeeOverview['employee'], 'id'>;

export default function ContributionHistoryPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'employee-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContributionsData = useCallback(async () => {
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
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchContributionsData,
    {
      context: 'contributions',
      enabled: autoRefreshEnabled,
      pauseWhenHidden: true,
      pauseWhenInactive: true,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const contributions = data?.contributions;
  const summary = data?.summary;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters);

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  const { handleExport } = useEMPContributionsExport({
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
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Contributions
                </h1>
                <p className='text-muted-foreground'>
                  Track your provident fund growth and contributions over time
                </p>
              </div>
            </div>
            {/* Refresh Controls */}
            <div className='flex flex-wrap items-center gap-3'>
              {/* Last Updated */}
              {lastUpdated && (
                <div className='text-muted-foreground text-right text-sm'>
                  <p className='font-medium'>Last updated</p>
                  <p className='text-xs'>
                    {lastUpdated.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}
              {/* Manual Refresh Button */}
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={isRefreshing}
                className='gap-2'
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
          {/* Auto-refresh Status Banner */}
          {!autoRefreshEnabled && (
            <div className='bg-muted/50 mt-4 mb-8 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5'>
              <AlertCircle className='text-muted-foreground h-4 w-4' />
              <p className='text-muted-foreground text-sm'>
                Auto-refresh is disabled. Data will only update when manually
                refreshed.
              </p>
            </div>
          )}
        </div>

        {/* Loading Overlay for Background Refresh */}
        {loading && data && (
          <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
            <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              <span className='text-sm font-medium'>Updating data...</span>
            </div>
          </div>
        )}

        {summary && <ContributionStats summary={summary} />}
        {/* Data Table */}
        <Card>
          <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <FileText className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>
                Detailed Contribution History
                <p className='text-muted-foreground text-sm'>
                  Monthly breakdown of your contributions for the selected
                  period
                </p>
              </CardTitle>
            </div>
            <ExportDropdown onExport={handleExport} />
          </CardHeader>
          <CardContent>
            <div className='overflow-auto'>
              {/* Your existing EmployeeContributionsTable component */}
              <EmployeeContributionsTable table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ContributionsProvider>
  );
}
