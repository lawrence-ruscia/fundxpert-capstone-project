import { getAllLoans, getLoanStatusSummary } from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { LoanStatusSummary } from '../components/LoanStatusSummary';
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
import { LoansDataProvider } from '../components/LoansDataProvider';
import { loansDataColumns } from '../components/LoansDataColumn';
import { LoansDataTable } from '../components/LoansDataTable';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { useLoansDataExport } from '../hooks/useLoansDataExport';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { Button } from '@/components/ui/button';

export const LoansDashboardPage = () => {
  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContributionsHandler = useCallback(async () => {
    const [loans, summary] = await Promise.all([
      getAllLoans(),
      getLoanStatusSummary(),
    ]);

    return { loans, summary };
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchContributionsHandler,
    {
      context: 'loan-table',
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

  const loans = data?.loans;
  const summary = data?.summary;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters, 'created_at');

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  console.log('Start', dateRange.start);
  console.log('End', dateRange.end);

  // Export functionality
  const { handleExport } = useLoansDataExport({
    dateRange: {
      start: dateRange.start,
      end: dateRange.end ?? new Date().toLocaleDateString(),
    },
  });

  const table = useReactTable({
    data: loans ?? [],
    columns: loansDataColumns,
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
    <LoansDataProvider>
      <div className='space-y-6'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Loans Management
                </h1>
                <p className='text-muted-foreground'>
                  Manage requests and track the status of all employee loans
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
        {summary && <LoanStatusSummary summary={summary ?? []} />}

        {/* Loans Table */}
        <Card>
          <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <FileText className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>
                Loans data table
                <p className='text-muted-foreground text-sm'>
                  Detailed table for tracking all employee loan applications and
                  status.
                </p>
              </CardTitle>
            </div>
            <div className='flex items-center gap-4'>
              <ExportDropdown onExport={handleExport} variant='outline' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-auto'>
              <LoansDataTable table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </LoansDataProvider>
  );
};
