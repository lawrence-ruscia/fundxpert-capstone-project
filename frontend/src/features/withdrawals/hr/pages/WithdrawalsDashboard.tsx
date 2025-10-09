import type {
  WithdrawalRequest,
  WithdrawalSummary,
} from '../../employee/types/withdrawal';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { FileText } from 'lucide-react';

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
import { useState } from 'react';
import {
  getAllWithdrawals,
  getWithdrawalStatusSummary,
} from '../services/hrWithdrawalService';
import { withdrawalsColumns } from '../components/WithdrawalsColumn';
import { WithdrawalDataProvider } from '../components/WithdrawalDataProvider';
import { WithdrawalsTable } from '../components/WithdrawalsTable';
import { WithdrawalStatusSummary } from '../components/WithdrawalStatusSummary';

export const WithdrawalsDashboardPage = () => {
  const { data, loading, error } = useMultiFetch<{
    requests: WithdrawalRequest[];
    summary: WithdrawalSummary[];
  }>(async () => {
    const [requests, summary] = await Promise.all([
      getAllWithdrawals(),
      getWithdrawalStatusSummary(),
    ]);

    return { requests, summary };
  });

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

  console.log('Start', dateRange.start);
  console.log('End', dateRange.end);

  // Export functionality
  //   const { handleExport } = useLoansDataExport({
  //     dateRange: {
  //       start: dateRange.start,
  //       end: dateRange.end ?? new Date().toLocaleDateString(),
  //     },
  //   });

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
          <div className='mb-4 gap-3'>
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
        </div>
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
              {/* <ExportDropdown onExport={handleExport} variant='outline' /> */}
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
