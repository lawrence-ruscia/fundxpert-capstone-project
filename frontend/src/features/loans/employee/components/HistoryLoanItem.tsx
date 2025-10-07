import { Button } from '@/components/ui/button';
import type { Loan } from '../types/loan';
import { LoanStatusBadge } from './LoanStatusBadge';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HistoryLoanItem({ loan }: { loan: Loan }) {
  return (
    <div className='rounded-lg border p-4 transition-shadow hover:shadow-md'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='font-semibold'>Loan #{loan.id}</span>
          <LoanStatusBadge size='sm' status={loan.status} />
        </div>
        <span className='text-lg font-bold'>
          ₱{loan.amount.toLocaleString()}
        </span>
      </div>

      <div className='mb-3 flex items-center justify-between text-sm'>
        <span>Applied: {new Date(loan.created_at).toLocaleDateString()}</span>
        {loan.monthly_amortization && (
          <span>Monthly: ₱{loan.monthly_amortization.toLocaleString()}</span>
        )}
      </div>

      {loan.purpose_category && (
        <p className='mb-3 line-clamp-2 text-sm'>
          Purpose: {loan.purpose_category}
        </p>
      )}

      <Button variant='secondary' size='sm' className='w-full'>
        <Link
          className='flex items-center gap-2'
          to={`/employee/loans/${loan.id}`}
        >
          <Eye className='mr-2 h-4 w-4' />
          View Loan Details
        </Link>
      </Button>
    </div>
  );
}
