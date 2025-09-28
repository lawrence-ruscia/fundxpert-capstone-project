import { useParams, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import {
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { useState, useCallback, useEffect } from 'react';
import { contributionsColumns } from '../components/EmployeeContributionsColumn';
import { EmployeeContributionsTable } from '../components/EmployeeContributionsTable';
import { EmployeeContributionsProvider } from '../components/EmployeeContributionsProvider';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Briefcase,
  Building,
  Building2,
  FileText,
  Hash,
  Percent,
  PiggyBank,
  TrendingUp,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmploymentStatusBadge } from '@/features/dashboard/employee/components/EmployeeStatusBadge';
import { useEmployeeContributionsData } from '../hooks/useEmployeeContributionsData';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';

export default function EmployeeContributionsPage() {
  const { id: userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, loading, error, refetch } = useEmployeeContributionsData(
    Number(userId)
  );

  const employee = data?.employee;
  const contributions = data?.contributions;
  const summary = data?.summary;

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

  if (loading) {
    return <LoadingSpinner text={'Loading Employee Contributions...'} />;
  }

  if (error) {
    return <NetworkError message={error} />;
  }

  return (
    <EmployeeContributionsProvider>
      <div>
        <div className='mb-8'>
          <div className='mb-4 gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => window.history.back()}
              className='p-2'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Employee Contributions
              </h1>
              <p className='text-muted-foreground'>
                Manage and track contribution history for {employee?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Employee Profile Card */}
        <Card className='mb-6'>
          <CardHeader className='pb-3'>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <User className='text-primary h-5 w-5' />
              </div>
              Employee Profile
            </CardTitle>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='space-y-3'>
              {/* Name and Basic Info */}
              <div>
                <h3 className='text-lg font-semibold'>{employee?.name}</h3>
                <div className='text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm'>
                  <div className='flex items-center gap-1'>
                    <Hash className='h-3 w-3' />
                    {employee?.employee_id}
                  </div>
                  <div className='flex items-center gap-1'>
                    <Building className='h-3 w-3' />
                    {employee?.department}
                  </div>
                  <div className='flex items-center gap-1'>
                    <Briefcase className='h-3 w-3' />
                    {employee?.position}
                  </div>
                </div>
              </div>

              {/* Compact Grid */}
              <div className='grid grid-cols-2 gap-3 border-t pt-2 lg:grid-cols-4'>
                <div>
                  <p className='text-muted-foreground text-sm'>Date Hired</p>
                  <p className='text-sm font-medium'>
                    {employee?.date_hired &&
                      new Date(employee.date_hired).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>Status</p>
                  {employee?.employment_status && (
                    <EmploymentStatusBadge
                      status={employee?.employment_status}
                    />
                  )}
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>
                    Monthly Salary
                  </p>
                  <p className='text-sm font-medium'>
                    ₱{employee?.salary.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-sm'>Email</p>
                  <p
                    className='truncate text-sm font-medium'
                    title={employee?.email}
                  >
                    {employee?.email}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contribution Summary */}
        {summary && (
          <Card className='mb-8'>
            <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <TrendingUp className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>Contribution Summary</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <BalanceCard
                label=' Total Contributions'
                value={formatCurrency(summary?.total_contributions)}
                icon={PiggyBank}
                comparison={`Last contribution: ${summary.last_contribution && formatDisplayDate(new Date(summary.last_contribution))}`}
              />
              <BalanceCard
                label='Employee Contributions'
                value={formatCurrency(summary.total_employee)}
                icon={User}
              />
              <BalanceCard
                label='Employer Contributions'
                value={formatCurrency(summary.total_employee)}
                icon={Building2}
              />
              <BalanceCard
                label='Monthly Average'
                value={formatCurrency(summary.average_monthly)}
                icon={Percent}
                comparison={`Total contribution records: ${summary?.contribution_count}`}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
            <div className='bg-primary/10 rounded-lg p-2'>
              <FileText className='h-5 w-5' />
            </div>
            <CardTitle className='text-lg'>
              Contribution History
              <p className='text-muted-foreground text-sm'>
                Detailed breakdown of all contributions for this employee
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-auto'>
              {/* Your existing EmployeeContributionsTable component */}
              <EmployeeContributionsTable table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </EmployeeContributionsProvider>
  );
}

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us', {
    year: 'numeric',
    day: '2-digit',
    month: 'short',
  });
};
