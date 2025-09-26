import { EmployeesProvider } from '../components/EmployeesProvider';
import { Main } from '@/shared/layout/Main';
import { EmployeesPrimaryButtons } from '../components/EmployeesPrimaryButtons';
import { useCallback, useEffect, useState } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import { employeesColumns } from '../components/EmployeesColumn';
import { getEmployees } from '../services/hrService';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { EmployeesTable } from '../components/EmployeesTable';
import type { HREmployeeRecord } from '../types/employeeTypes';
import { useEmployeeForm } from '../hooks/useEmployeeForm';
import { useSearchParams } from 'react-router-dom';

export const EmployeeListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error } = useApi<HREmployeeRecord[]>(getEmployees);
  const {
    data: empMetadata,
    loading: empMetaLoading,
    error: empMetaError,
  } = useEmployeeForm();

  // Get pagination values from URL or use defaults
  const pageIndex = parseInt(searchParams.get('page') || '1', 10) - 1; // URL is 1-based, table is 0-based
  const pageSize = parseInt(searchParams.get('size') || '10', 10);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: Math.max(0, pageIndex), // Ensure non-negative
    pageSize: [10, 20, 30, 40, 50].includes(pageSize) ? pageSize : 10, // Validate page size
  });

  // Sync pagination changes to URL
  const handlePaginationChange = useCallback(
    (updater: unknown) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;

      setPagination(newPagination);

      // Update URL with new pagination values
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('page', (newPagination.pageIndex + 1).toString()); // Convert to 1-based
      newSearchParams.set('size', newPagination.pageSize.toString());

      setSearchParams(newSearchParams);
    },
    [pagination, searchParams, setSearchParams]
  );

  // Sync URL changes back to table state
  useEffect(() => {
    const urlPageIndex = parseInt(searchParams.get('page') || '1', 10) - 1;
    const urlPageSize = parseInt(searchParams.get('size') || '10', 10);

    setPagination(prev => {
      const newPageIndex = Math.max(0, urlPageIndex);
      const newPageSize = [10, 20, 30, 40, 50].includes(urlPageSize)
        ? urlPageSize
        : 10;

      if (prev.pageIndex !== newPageIndex || prev.pageSize !== newPageSize) {
        return { pageIndex: newPageIndex, pageSize: newPageSize };
      }
      return prev;
    });
  }, [searchParams]);

  const departments = empMetadata.departments?.map(d => {
    return {
      label: d.name,
      value: d.name,
    };
  });
  const positions = empMetadata.positions?.map(p => {
    return {
      label: p.title,
      value: p.title,
    };
  });

  const table = useReactTable({
    data: data ?? [],
    columns: employeesColumns,
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

  if (loading || empMetaLoading) {
    return <LoadingSpinner text={'Loading Employee List'} />;
  }

  if (error || empMetaError) {
    return <NetworkError message={error?.message || empMetaError} />;
  }

  return (
    <EmployeesProvider>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Employee List</h2>
            <p className='text-muted-foreground'>
              Manage employee records and account details.
            </p>
          </div>
          <EmployeesPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <EmployeesTable
            table={table as Table<HREmployeeRecord>}
            metadata={{ departments, positions }}
          />
        </div>
      </Main>
    </EmployeesProvider>
  );
};
