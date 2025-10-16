import { Button } from '@/components/ui/button';
import type { Loan } from '../types/loan';
import { LoanStatusBadge } from './LoanStatusBadge';
import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';

export function HistoryLoanItem({ loan }: { loan: Loan }) {
  const navigate = useNavigate();
  return (
    <div className='rounded-lg border p-4 transition-shadow hover:shadow-md'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <span className='font-semibold'>Loan #{loan.id}</span>
          <LoanStatusBadge size='sm' status={loan.status} />
        </div>
        <span className='text-lg font-bold'>
          {formatCurrency(Number(loan.amount))}
        </span>
      </div>

      <div className='mb-3 flex items-center justify-between text-sm'>
        <span>Applied: {new Date(loan.created_at).toLocaleDateString()}</span>
        {loan.monthly_amortization && (
          <span>
            Monthly:{' '}
            {formatCurrency(Number(loan.monthly_amortization.toLocaleString()))}
          </span>
        )}
      </div>

      {loan.purpose_category && (
        <p className='mb-3 line-clamp-2 text-sm'>
          Purpose: {loan.purpose_category}
        </p>
      )}

      <Button
        variant='secondary'
        size='sm'
        className='flex w-full items-center gap-2'
        onClick={() => navigate(`/employee/loans/${loan.id}`)}
      >
        <Eye className='mr-2 h-4 w-4' />
        View Loan Details
      </Button>
    </div>
  );
}
