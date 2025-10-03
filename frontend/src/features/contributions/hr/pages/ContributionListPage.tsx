import type { Contribution } from '../types/hrContribution';
import { hrContributionsService } from '../services/hrContributionService.js';
import { useApi } from '@/shared/hooks/useApi.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';
import { useNavigate } from 'react-router-dom';
import { useContributionsExport } from '../hooks/useContributionsExport.js';
import { useState } from 'react';
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
import { ArrowLeft, FileText } from 'lucide-react';
import { ContributionsProvider } from '../components/ContributionsProvider.js';
import { EmployeeContributionsTable } from '../components/EmployeeContributionsTable.js';
import { Button } from '@/components/ui/button.js';
export default function ContributionListPage() {
  const {
    data: contributions,
    loading,
    error,
  } = useApi<Contribution[]>(() =>
    hrContributionsService.getAllContributions()
  );

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
  const { handleExport } = useContributionsExport({
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
        <div className='mb-8'>
          <div className='mb-4 gap-3'>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => navigate('/hr/employees')}
              className='p-2'
            >
              <ArrowLeft className='h-4 w-4' />
            </Button>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>
                Contributions List
              </h1>
              <p className='text-muted-foreground'>
                Manage and track contribution history for all employees
              </p>
            </div>
          </div>
        </div>

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
