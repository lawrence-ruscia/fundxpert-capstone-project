import { hrContributionsService } from '../services/hrContributionService.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';
import { Link } from 'react-router-dom';
import { useHRContributionsExport } from '../hooks/useHRContributionsExport.js';
import { useCallback, useState } from 'react';
import { useTablePagination } from '@/shared/hooks/useTablePagination.js';
import { useDateRangeFilter } from '@/shared/hooks/useDateRangeFilter.js';
import {
  type SortingState,
  type ColumnFiltersState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { allContributionsColumns } from '../components/AllContributionsColumn.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card.js';
import { ExportDropdown } from '@/shared/components/ExportDropdown.js';
import {
  AlertCircle,
  Building2,
  FileText,
  Percent,
  PiggyBank,
  Plus,
  RefreshCw,
  TrendingUp,
  User,
} from 'lucide-react';
import { ContributionsProvider } from '../components/ContributionsProvider.js';
import { Button } from '@/components/ui/button.js';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard.js';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters.js';
import { AllContributionsTable } from '../components/AllContributionsTable.js';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling.js';
import { usePersistedState } from '@/shared/hooks/usePersistedState.js';
export default function ContributionListPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'hr-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchContributionsHandler = useCallback(async () => {
    const [contributions, summary] = await Promise.all([
      hrContributionsService.getAllContributions(),
      hrContributionsService.getAllContributionsSummary(),
    ]);

    return { contributions, summary };
  }, []);

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

  // Export functionality
  const { handleExport } = useHRContributionsExport({
    dateRange: {
      start: dateRange.start,
      end: dateRange.end ?? new Date().toLocaleDateString(),
    },
  });

  const table = useReactTable({
    data: contributions ?? [],
    columns: allContributionsColumns,
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
      <div>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Contributions List
                </h1>
                <p className='text-muted-foreground'>
                  Manage and track contribution history for all employees
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

        {/* Balance Cards */}
        {summary && (
          <Card className='mb-8'>
            <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <TrendingUp className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>Contributions Summary</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
              <BalanceCard
                label=' Total Contributions'
                value={formatCurrency(Number(summary?.total_contributions))}
                icon={PiggyBank}
              />
              <BalanceCard
                label='Total Employee Contributions'
                value={formatCurrency(Number(summary.total_employee))}
                icon={User}
              />
              <BalanceCard
                label='Total Employer Contributions'
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

        {/* Contribution History Table */}
        <Card>
          <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
            <div className='flex items-center gap-2'>
              <div className='bg-primary/10 rounded-lg p-2'>
                <FileText className='h-5 w-5' />
              </div>
              <CardTitle className='text-lg'>
                Contributions History
                <p className='text-muted-foreground text-sm'>
                  Detailed breakdown of all contributions for all employees
                </p>
              </CardTitle>
            </div>
            <div className='flex items-center gap-4'>
              <Button>
                <Plus />
                <Link to='/hr/contributions/new'>Add contribution</Link>
              </Button>
              <ExportDropdown onExport={handleExport} variant='outline' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='overflow-auto'>
              <AllContributionsTable table={table} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ContributionsProvider>
  );
}
