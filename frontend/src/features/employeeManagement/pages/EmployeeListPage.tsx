import { EmployeesProvider } from '../components/EmployeesProvider';

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
import {
  getDepartments,
  getEmployees,
  getPositions,
} from '../services/hrService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { EmployeesTable } from '../components/EmployeesTable';
import type { HREmployeeRecord } from '../types/employeeTypes';
import { useSearchParams } from 'react-router-dom';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  BanknoteArrowDown,
  FileText,
  PiggyBank,
  RefreshCw,
  Users,
  Wallet,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { fetchHROverview } from '@/features/dashboard/hr/services/hrDashboardService';

export const EmployeeListPage = () => {
  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEmployeesHandler = useCallback(async () => {
    const [employees, departments, positions, overview] = await Promise.all([
      getEmployees(),
      getDepartments(),
      getPositions(),
      fetchHROverview(),
    ]);

    return { employees, departments, positions, overview };
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchEmployeesHandler,
    {
      context: 'employees',
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

  const [searchParams, setSearchParams] = useSearchParams();

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

  const table = useReactTable({
    data: data?.employees ?? [],
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

  if (loading) {
    return <LoadingSpinner text={'Loading employees...'} />;
  }

  if (error) {
    return <NetworkError message={error} />;
  }

  const departmentsFiltered = data?.departments.map(d => {
    return {
      label: d.name,
      value: d.name,
    };
  });
  const positionsFiltered = data?.positions.map(p => {
    return {
      label: p.title,
      value: p.title,
    };
  });

  const overview = data?.overview;

  return (
    <EmployeesProvider>
      <div className='mx-auto space-y-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Employees List
                </h1>
                <p className='text-muted-foreground'>
                  Manage employee records and details
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
      </div>

      <Card className='mb-8'>
        <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
          <div className='bg-primary/10 rounded-lg p-2'>
            <Users className='h-5 w-5' />
          </div>
          <CardTitle className='text-lg'>Employees Summary</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <BalanceCard
            label='Total Employees'
            value={String(overview?.total_employees)}
            icon={Users}
            description={`${overview?.active_employees} active employees`}
          />
          <BalanceCard
            label='Total Contributions'
            value={formatCurrency(
              Number(overview?.total_employee_contributions) +
                Number(overview?.total_employer_contributions)
            )}
            icon={PiggyBank}
            description={`${formatCurrency(Number(overview?.total_employee_contributions))} from employee`}
          />

          <BalanceCard
            label='Pending Loans'
            value={String(overview?.pending_loans)}
            icon={Wallet}
            description={`${String(overview?.approved_loans_this_month ?? 0)} approved loans this month`}
          />

          <BalanceCard
            label='Pending Withdrawals'
            value={String(overview?.pending_withdrawals)}
            icon={BanknoteArrowDown}
            description={`${String(overview?.processsed_withdrawals_this_month ?? 0)} processed withdrawals this month`}
          />
        </CardContent>
      </Card>

      {/* Contribution History Table */}
      <Card>
        <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 rounded-lg p-2'>
              <Users className='h-5 w-5' />
            </div>
            <CardTitle className='text-lg'>
              Employees Table
              <p className='text-muted-foreground text-sm'>
                Detailed breakdown of all employees
              </p>
            </CardTitle>
          </div>
          <div className='flex items-center gap-4'>
            <EmployeesPrimaryButtons />
            {/* <ExportDropdown onExport={handleExport} variant='outline' /> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-auto'>
            <EmployeesTable
              table={table as Table<HREmployeeRecord>}
              metadata={{
                departments: departmentsFiltered,
                positions: positionsFiltered,
              }}
            />
          </div>
        </CardContent>
      </Card>
    </EmployeesProvider>
  );
};
