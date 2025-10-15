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
import {
  AlertCircle,
  FileText,
  RefreshCw,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button.js';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard.js';

import {
  getAuditLogs,
  getAuditSummaryCategory,
} from '@/features/dashboard/admin/services/adminService.js';
import { NetworkError } from '@/shared/components/NetworkError.js';

import { usePersistedState } from '@/shared/hooks/usePersistedState';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling';
import { SystemLogsProvider } from '../components/SystemLogsProvider';
import { SystemLogsTable } from '../components/SystemLogsTable';
import { systemLogsColumns } from '../components/SystemLogsColumn';

export default function AdminUserManagementPage() {
  const [autoRefreshEnabled] = usePersistedState(
    'admin-dashboard-auto-refresh',
    true // default value
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const logs = await getAuditLogs();
      const summary = await getAuditSummaryCategory();
      return { logs, summary };
    } catch (err) {
      console.error('Error fetching audit data', err);
      return { logs: [], summary: [] };
    }
  }, []);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchAuditLogs,
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
  // const { handleExport } = useUsersExport({
  //   dateRange: {
  //     start: dateRange.start,
  //     end: dateRange.end ?? new Date().toLocaleDateString(),
  //   },
  // });

  const logs = data?.logs ?? [];
  console.log(logs);

  const table = useReactTable({
    data: logs,
    columns: systemLogsColumns,
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

  if (loading) return <LoadingSpinner text='Loading system logs...' />;
  if (error) return <NetworkError message={error} />;
  if (!data && !loading)
    return <DataError title='Failed to load system logs' />;

  const { summary } = data;

  const auth = summary?.find(a => a.category === 'Auth')?.total_actions ?? 0;
  const userMgmt =
    summary?.find(a => a.category === 'UserManagement')?.total_actions ?? 0;
  const system =
    summary?.find(s => s.category === 'System')?.total_actions ?? 0;
  return (
    <SystemLogsProvider>
      <div>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex flex-wrap items-start justify-between gap-4'>
            <div className='flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  System Audit Logs
                </h1>
                <p className='text-muted-foreground'>
                  Monitor and review all system-level actions and events
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
      <div className='mb-6 grid gap-4 lg:grid-cols-3'>
        <BalanceCard label='Auth Events' value={String(auth)} icon={Shield} />
        <BalanceCard
          label='User Management'
          value={String(userMgmt)}
          icon={Users}
        />
        <BalanceCard
          label='System Events'
          value={String(system)}
          icon={Settings}
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
              System Logs
              <p className='text-muted-foreground text-sm'>
                Shows the latest 100 audit records of recent user and system
                actions.
              </p>
            </CardTitle>
          </div>

          <div className='flex items-center gap-4'>
            {/* <ExportDropdown
              onExport={handleExport}
              variant='outline'
              enablePdf={false}
            /> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-auto'>
            <SystemLogsTable table={table} />
          </div>
        </CardContent>
      </Card>
    </SystemLogsProvider>
  );
}
