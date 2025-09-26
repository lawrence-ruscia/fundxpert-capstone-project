import { useMemo, useState } from 'react';
import { Calendar, Download } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { ContributionHistoryTable } from '../components/ContributionHistoryTable';
import { useEmployeeContributions } from '../hooks/useEmployeeContributions';
import type { ContributionPeriod } from '../types/employeeContributions';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useEmployeeOverview } from '@/features/dashboard/employee/hooks/useEmployeeOverview';
import { Button } from '@/components/ui/button';
import { useCSVExport } from '../hooks/useCSVExport';
import { EmployeeContributionsResponseSchema } from '../schema/table-schema';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  type Table,
} from '@tanstack/react-table';
import { columns } from '../components/data-columns';
import type { EmployeeOverview } from '@/features/dashboard/employee/types/employeeOverview';
import { periodOptions } from '../data/periodOptions';
import { ContributionStats } from '../components/ContributionStats';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { NetworkError } from '@/shared/components/NetworkError';
import { DataError } from '@/shared/components/DataError';

export type EmployeeMetadata = Omit<EmployeeOverview['employee'], 'id'>;

export default function ContributionHistoryPage() {
  const [period, setPeriod] = useState<ContributionPeriod>('year');
  const {
    data,
    loading: contributionsLoading,
    error: contributionsError,
  } = useEmployeeContributions(period);
  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
  } = useEmployeeOverview();

  const selectedPeriodOption = periodOptions.find(
    option => option.value === period
  );

  // Combined loading state
  const loading = contributionsLoading || overviewLoading;

  // Combined error state
  const error = contributionsError || overviewError;

  // Only create metadata when overview is available
  const employeeMetadata: EmployeeMetadata | null = useMemo(() => {
    if (!overview?.employee) return null;

    return {
      name: overview.employee.name,
      employee_id: overview.employee.employee_id,
      department: overview.employee.department,
      position: overview.employee.position,
      employment_status: overview.employee.employment_status,
      date_hired: overview.employee.date_hired,
      salary: overview.employee.salary,
    };
  }, [overview]);

  const validatedData = useMemo(() => {
    try {
      return EmployeeContributionsResponseSchema.parse(data);
    } catch (error) {
      console.error('Invalid contribution data:', error);
      return {
        contributions: [],
        totals: { employee: 0, employer: 0, vested: 0, grand_total: 0 },
      };
    }
  }, [data]);

  // Transform data with cumulative calculation
  const tableData = useMemo(() => {
    let cumulative = 0;
    return validatedData.contributions.map(record => {
      cumulative += record.total;
      return {
        ...record,
        cumulative,
        monthYear: `${record.month} ${record.year}`,
        sortDate: new Date(`${record.month} 1, ${record.year}`),
      };
    });
  }, [validatedData.contributions]);

  // Table states
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
      pagination,
    },
  });

  // Get the sorted data from the table for CSV export
  const sortedRows = table.getSortedRowModel().rows;
  const sortedTableData = useMemo(() => {
    return sortedRows.map(row => row.original);
  }, [sortedRows]);

  // CSV Export hook - now using sorted data
  const exportCSV = useCSVExport(
    sortedTableData, // Pass the sorted data instead of original tableData
    data?.totals ?? {
      employee: 0,
      employer: 0,
      vested: 0,
      grand_total: 0,
    },
    employeeMetadata ?? {
      name: 'John Doe',
      employee_id: 'EMP001',
      employment_status: 'Active',
      department: 'IT',
      position: 'Software Engineer',
      date_hired: '2025-01-01',
      salary: 10000,
    },
    period
  );

  if (loading) {
    return <LoadingSpinner text={'Loading Contribution History'} />;
  }

  if (error) {
    return <NetworkError message={error?.message || overviewError?.message} />;
  }

  if (!data) {
    return (
      <DataError
        title='No contribution data available'
        message='Unable to fetch employee contribution data'
      />
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Contribution History
          </h1>
          <p className='text-muted-foreground'>
            Track your provident fund contributions and growth over time
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Badge className='bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-semibold shadow-xs transition-colors'>
            <div className='flex items-center gap-2'>
              <Calendar size={20} />
              <p>{selectedPeriodOption?.label}</p>
            </div>
          </Badge>
          <Button
            onClick={exportCSV}
            variant='outline'
            size='lg'
            className='gap-2'
          >
            <Download className='h-4 w-4' />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card className='@container/card'>
        <CardHeader className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Time Period</CardTitle>
            <CardDescription>
              {selectedPeriodOption && (
                <p className='text-muted-foreground text-sm'>
                  {selectedPeriodOption.description}
                </p>
              )}
            </CardDescription>
          </div>
          <Calendar />
        </CardHeader>
        <CardContent>
          <div className='flex flex-col space-y-2'>
            <ToggleGroup
              type='single'
              value={period}
              onValueChange={value => setPeriod(value as ContributionPeriod)}
              variant='outline'
              className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'
            >
              {periodOptions.map(option => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select
              value={period}
              onValueChange={value => setPeriod(value as ContributionPeriod)}
            >
              <SelectTrigger
                className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
                size='sm'
                aria-label='Select a value'
              >
                <SelectValue placeholder='Select time period' />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <ContributionStats contributionData={data} />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            Detailed Contribution History
          </CardTitle>
          <CardDescription>
            Monthly breakdown of your contributions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionHistoryTable
            data={data}
            table={table as Table<RowData>}
          />
        </CardContent>
      </Card>
    </div>
  );
}
