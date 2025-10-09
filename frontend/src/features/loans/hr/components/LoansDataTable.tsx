import {
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Table,
} from '@/components/ui/table';
import { contributionsColumns } from '@/features/contributions/employee/components/ContributionColumns';

import { type Table as TableType, flexRender } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { DataTableToolbar } from '@/shared/components/DataTableToolbar';
import { DataTablePagination } from '@/shared/components/Pagination';
import type { Loan } from '../../employee/types/loan';
type LoansDataTableProps = {
  table: TableType<Loan>;
};

export const LoansDataTable = ({ table }: LoansDataTableProps) => {
  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Search by employee name...'
        searchKey='employee_name' 
        includeSearch={true}
        filters={[
          {
            columnId: 'status',
            title: 'Loan Status',
            options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Incomplete', value: 'Incomplete' },
              { label: 'Under HR Review', value: 'UnderReviewOfficer' },
              { label: 'Awaiting Approvals', value: 'Awaiting Approvals' },
              { label: 'Pending Next Approval', value: 'PendingNextApproval' },
              { label: 'Approved', value: 'Approved' },
              { label: 'Released', value: 'Released' },
              { label: 'Rejected', value: 'Rejected' },
              { label: 'Cancelled', value: 'Cancelled' },
            ],
          },

          {
            columnId: 'purpose_category',
            title: 'Purpose',
            options: [
              { label: 'Medical', value: 'Medical' },
              { label: 'Education', value: 'Education' },
              { label: 'Housing', value: 'Housing' },
              { label: 'Emergency', value: 'Emergency' },
              { label: 'Debt', value: 'Debt' },
              { label: 'Others', value: 'Others' },
            ],
          },

          {
            columnId: 'created_at',
            title: 'Date Range',
            type: 'date-range', // Add this type to distinguish from regular select filters
            options: [], // Empty since this will be a date picker
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={contributionsColumns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};
