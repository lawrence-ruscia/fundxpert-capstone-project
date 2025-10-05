import { Ellipsis } from 'lucide-react';
import { type Row } from '@tanstack/react-table';
import { UserPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Loan } from '../../employee/types/loan.js';
import { useNavigate } from 'react-router-dom';
import { useLoansData } from './LoansDataProvider.js';

type DataTableRowActionsProps = {
  row: Row<Loan>;
};

export function LoanTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useLoansData();
  const navigate = useNavigate();
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
          // onClick={() => {
          //   setCurrentRow(row.original);
          //   setOpen('edit');
          //   navigate(`/hr/contributions/${row.original.id}/edit`);
          // }}
          >
            Approve
            <DropdownMenuShortcut>
              <UserPen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
