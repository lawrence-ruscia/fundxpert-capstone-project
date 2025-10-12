import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';
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
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card.js';
import { ExportDropdown } from '@/shared/components/ExportDropdown.js';
import {
  Activity,
  AlertCircle,
  FileText,
  KeyRound,
  Lock,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button.js';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard.js';

import {
  getAllUsers,
  getUserSummary,
} from '@/features/dashboard/admin/services/adminService.js';
import { NetworkError } from '@/shared/components/NetworkError.js';
import { UsersProvider } from '../components/UsersProvider';
import { useUsersExport } from '../hooks/useUsersExport';
import { usersColumns } from '../components/UsersColumn';
import { UsersTable } from '../components/UsersTable';
import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { UsersPrimaryButtons } from '../components/UsersPrimaryButtons';

export default function AdminUserManagementPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'admin-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsersData = useCallback(async () => {
    const users = await getAllUsers();
    const summary = await getUserSummary();

    return { users, summary };
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchUsersData,
    {
      context: 'users',
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

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});

  // Date range from filters
  const dateRange = useDateRangeFilter(columnFilters, 'created_at');

  // Sync pagination changes to URL
  const { pagination, handlePaginationChange } = useTablePagination();

  // Export functionality
  const { handleExport } = useUsersExport({
    dateRange: {
      start: dateRange.start,
      end: dateRange.end ?? new Date().toLocaleDateString(),
    },
  });

  const table = useReactTable({
    data: data?.users ?? [],
    columns: usersColumns,
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

  if (loading) return <LoadingSpinner text='Loading users data...' />;
  if (error) return <NetworkError message={error} />;
  if (!data)
    return (
      <DataError
        title='Failed to load users'
        message='Please try refreshing the page or contact support'
      />
    );

  const { summary } = data;

  return (
    <UsersProvider>
      <div>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  User Management
                </h1>
                <p className='text-muted-foreground'>
                  Central hub for managing user accounts, roles, and security
                  status.
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

      {/* Summary Cards */}
      <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <BalanceCard
          label='Total Users'
          value={String(summary.total_users)}
          icon={Users}
        />
        <BalanceCard
          label='Active Users'
          value={String(summary.active_users)}
          icon={Activity}
        />
        <BalanceCard
          label='Locked Accounts'
          value={String(summary.locked_accounts)}
          icon={Lock}
        />
        <BalanceCard
          label='Temp Password Users'
          value={String(summary.temp_password_users)}
          icon={KeyRound}
        />
      </div>

      {/* Contribution History Table */}
      <Card>
        <CardHeader className='mb-4 flex flex-wrap items-center justify-between gap-4 font-semibold'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 rounded-lg p-2'>
              <FileText className='h-5 w-5' />
            </div>
            <CardTitle className='text-lg'>
              Users Table
              <p className='text-muted-foreground text-sm'>
                View and manage all system users with their roles and login
                activity.
              </p>
            </CardTitle>
          </div>

          <div className='flex items-center gap-4'>
            <UsersPrimaryButtons />
            <ExportDropdown
              onExport={handleExport}
              variant='outline'
              enablePdf={false}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-auto'>
            <UsersTable table={table} />
          </div>
        </CardContent>
      </Card>
    </UsersProvider>
  );
}
