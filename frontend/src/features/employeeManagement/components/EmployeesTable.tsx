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
import type { HREmployeeRecord } from '../types/employeeTypes';
import { DataTableToolbar } from '@/shared/components/DataTableToolbar';
import { DataTablePagination } from '@/shared/components/Pagination';

type EmployeesTableProps = {
  table: TableType<HREmployeeRecord>;
  metadata: unknown;
};
export const EmployeesTable = ({ table, metadata }: EmployeesTableProps) => {
  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter employees...'
        searchKey='name'
        filters={[
          {
            columnId: 'employment_status',
            title: 'Status',
            options: [
              { label: 'Active', value: 'Active' },
              { label: 'Retired', value: 'Retired' },
              { label: 'Resigned', value: 'Resigned' },
              { label: 'Terminated', value: 'Terminated' },
            ],
          },
          {
            columnId: 'department',
            title: 'Department',
            options: metadata?.departments,
          },
          {
            columnId: 'position',
            title: 'Position',
            options: metadata?.positions,
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
