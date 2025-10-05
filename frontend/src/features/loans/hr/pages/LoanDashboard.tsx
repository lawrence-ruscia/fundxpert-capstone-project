import type { Loan } from '../../employee/types/loan';
import { getAllLoans, getLoanStatusSummary } from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import { LoanStatusSummary } from '../components/LoanStatusSummary';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import type { LoanSummary } from '../types/hrLoanType';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

import { FileText, Plus } from 'lucide-react';

import { useContributionsExport } from '@/features/contributions/hr/hooks/useContributionsExport';
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
import { LoansDataProvider } from '../components/LoansDataProvider';
import { loansDataColumns } from '../components/LoansDataColumn';
import { LoansDataTable } from '../components/LoansDataTable';
import { ExportDropdown } from '@/shared/components/ExportDropdown';

export const LoansDashboardPage = () => {
  const { data, loading, error } = useMultiFetch<{
    loans: Loan[];
    summary: LoanSummary[];
  }>(async () => {
    const [loans, summary] = await Promise.all([
      getAllLoans(),
      getLoanStatusSummary(),
    ]);

    return { loans, summary };
  });

  const loans = data?.loans;
  const summary = data?.summary;

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters);

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  // Export functionality
  const { handleExport } = useContributionsExport({
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
          <div className='mb-4 gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Loans Management
              </h1>
              <p className='text-muted-foreground'>
                Manage requests and track the status of all employee loans
              </p>
            </div>
          </div>
        </div>
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
              {/* <ExportDropdown onExport={handleExport} variant='outline' /> */}
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
