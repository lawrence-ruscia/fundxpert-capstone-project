import { Bolt, Ellipsis, FileCheck, Pencil, Send, Wrench } from 'lucide-react';
import { type Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Loan } from '../../employee/types/loan.js';
import { useNavigate } from 'react-router-dom';
import { useLoanAccess } from '../hooks/useLoanAccess.js';

type DataTableRowActionsProps = {
  row: Row<Loan>;
};

export function LoanTableRowActions({ row }: DataTableRowActionsProps) {
  const { can, loading } = useLoanAccess(Number(row.original.id));

  const navigate = useNavigate();

  if (loading) return null;
  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <Ellipsis className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem
            onClick={() => {
              navigate(`/hr/loans/${row.original.id}`);
            }}
          >
            Manage
            <DropdownMenuShortcut>
              <Bolt size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {can('canApprove') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/hr/loans/${row.original.id}/approval`);
                }}
              >
                Approve
                <DropdownMenuShortcut>
                  <FileCheck size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
          {can('canRelease') && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  navigate(`/hr/loans/${row.original.id}/approval`);
                }}
              >
                Release
                <DropdownMenuShortcut>
                  <Send size={16} />
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
