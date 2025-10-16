import { useNavigate, useParams } from 'react-router-dom';
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
import { useCallback, useState } from 'react';
import { empContributionsColumns } from '../components/EmployeeContributionsColumn';
import { EmployeeContributionsTable } from '../components/EmployeeContributionsTable';
import { ContributionsProvider } from '../components/ContributionsProvider';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building,
  Building2,
  FileText,
  Hash,
  Percent,
  PiggyBank,
  RefreshCw,
  TrendingUp,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmploymentStatusBadge } from '@/features/dashboard/employee/components/EmployeeStatusBadge';
import { useEmployeeContributionsData } from '../hooks/useEmployeeContributionsData';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { ExportDropdown } from '@/shared/components/ExportDropdown';
import { useTablePagination } from '@/shared/hooks/useTablePagination';
import { useDateRangeFilter } from '@/shared/hooks/useDateRangeFilter';
import { useHRContributionsExport } from '../hooks/useHRContributionsExport';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { hrContributionsService } from '../services/hrContributionService';
import { getEmployeeById } from '@/features/employeeManagement/services/hrService';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';

// TODO: Make this Employee Summary, add loans, withdrawals
export default function EmployeeContributionsPage() {
  const { id } = useParams();

  const userId = Number(id);
  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContributionsHandler = useCallback(async () => {
    const [employee, contributions, summary] = await Promise.all([
      getEmployeeById(userId),
      hrContributionsService.getAllContributions({ userId }),
      hrContributionsService.getEmployeeContributionsSummary(userId),
    ]);

    return { employee, contributions, summary };
  }, [userId]);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchContributionsHandler,
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

  const navigate = useNavigate();

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters);

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  // Export functionality
  const { handleExport } = useHRContributionsExport({
    userId,
    dateRange: {
      start: dateRange.start,
      end: dateRange.end ?? new Date().toLocaleDateString(),
    },
    employee: data?.employee,
  });

  const employee = data?.employee;
  const contributions = data?.contributions;
  const summary = data?.summary;

  const table = useReactTable({
    data: contributions ?? [],
    columns: empContributionsColumns,
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
    <ContributionsProvider>
      <div>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/hr/contributions')}
            className='mb-4'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Contributions
          </Button>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Employee Contributions
                </h1>
                <p className='text-muted-foreground'>
                  Manage and track contribution history for {employee?.name}
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
              <span className='font`-medium text-sm'>Updating data...</span>
            </div>
          </div>
        )}

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
                value={formatCurrency(Number(summary?.total_contributions))}
                icon={PiggyBank}
                description={`Last contribution: ${summary.last_contribution && formatDisplayDate(new Date(summary.last_contribution))}`}
              />
              <BalanceCard
                label='Employee Contributions'
                value={formatCurrency(Number(summary.total_employee))}
                icon={User}
              />
              <BalanceCard
                label='Employer Contributions'
                value={formatCurrency(Number(summary.total_employee))}
                icon={Building2}
              />
              <BalanceCard
                label='Monthly Average'
                value={formatCurrency(Number(summary.average_monthly))}
                icon={Percent}
                description={`Total contribution records: ${summary?.contribution_count}`}
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <FileText className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>
                Contribution History
                <p className='text-muted-foreground text-sm'>
                  Detailed breakdown of all contributions for this employee
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

const formatDisplayDate = (dateString: Date) => {
  return dateString.toLocaleDateString('en-us', {
    year: 'numeric',
    day: '2-digit',
    month: 'short',
  });
};
