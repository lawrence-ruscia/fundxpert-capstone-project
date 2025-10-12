import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { AlertCircle, FileText, RefreshCw } from 'lucide-react';

import { useDateRangeFilter } from '@/shared/hooks/useDateRangeFilter';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import {
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useCallback, useState } from 'react';
import {
  getAllWithdrawals,
  getWithdrawalStatusSummary,
} from '../services/hrWithdrawalService';
import { withdrawalsColumns } from '../components/WithdrawalsColumn';
import { WithdrawalDataProvider } from '../components/WithdrawalDataProvider';
import { WithdrawalsTable } from '../components/WithdrawalsTable';
import { WithdrawalStatusSummary } from '../components/WithdrawalStatusSummary';
import { useWithdrawalsExport } from '../hooks/useWithdrawalsExport';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { Button } from '@/components/ui/button';

export const WithdrawalsDashboardPage = () => {
  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContributionsHandler = useCallback(async () => {
    const [requests, summary] = await Promise.all([
      getAllWithdrawals(),
      getWithdrawalStatusSummary(),
    ]);

    return { requests, summary };
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchContributionsHandler,
    {
      context: 'withdrawal-table',
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

  const requests = data?.requests;
  const summary = data?.summary;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters, 'created_at');

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  // Export functionality
  const { handleExport } = useWithdrawalsExport({
    dateRange: {
      start: dateRange.start,
      end: (() => {
        const endDate = dateRange.end || new Date().toISOString().split('T')[0];
        return `${endDate}T23:59:59.999`; // End of day
      })(),
    },
  });

  console.log('Start date: ', dateRange.start);
  console.log('End date: ', dateRange.end);
  console.log(
    'End date (with default): ',
    dateRange.end || new Date().toISOString().split('T')[0]
  );

  const table = useReactTable({
    data: requests ?? [],
    columns: withdrawalsColumns,
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

  if (loading) {
    return <LoadingSpinner text={'Loading data...'} />;
  }

  if (error) {
    return <DataError title='Error' message={'Error loading data'} />;
  }

  return (
    <WithdrawalDataProvider>
      <div className='space-y-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Withdrawals Management
                </h1>
                <p className='text-muted-foreground'>
                  Track the status and manage the lifecycle of all employee
                  withdrawal requests.
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

        {/* Loans Summary */}
        {summary && <WithdrawalStatusSummary summary={summary ?? []} />}
        {/* Loans Table */}
        <Card>
          <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <FileText className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>
                Withdrawal requests table
                <p className='text-muted-foreground text-sm'>
                  Detailed table to manage and track the status of all employee
                  loan withdrawal requests.
                </p>
              </CardTitle>
            </div>
            <div className='flex items-center gap-4'>
              <ExportDropdown onExport={handleExport} variant='outline' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-auto'>
              <WithdrawalsTable table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </WithdrawalDataProvider>
  );
};
