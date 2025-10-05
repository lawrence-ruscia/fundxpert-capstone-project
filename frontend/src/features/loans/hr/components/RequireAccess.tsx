import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { LoanAccess } from '../types/hrLoanType';
import { getLoanAccess } from '../services/hrLoanService';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';

interface RequireAccessProps {
  loanId?: number;
  requiredAccess: keyof LoanAccess;
  fallback?: React.ReactNode; // optional custom UI for denied access
  children: React.ReactNode;
}

/**
 * RequireAccess
 * Protects HR loan routes based on backend-provided access flags.
 * Usage:
 *   <RequireAccess requiredAccess="canAssignApprovers">
 *     <LoanReviewPage />
 *   </RequireAccess>
 */
export const RequireAccess: React.FC<RequireAccessProps> = ({
  loanId,
  requiredAccess,
  fallback,
  children,
}) => {
  const { user } = useAuth();
  const params = useParams<{ loanId: string }>();
  const navigate = useNavigate();
  const [access, setAccess] = useState<LoanAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedLoanId = loanId ?? Number(params.loanId);

  useEffect(() => {
    if (!resolvedLoanId || !user) return;

    async function fetchAccess() {
      try {
        setLoading(true);
        const res = await getLoanAccess(resolvedLoanId);
        setAccess(res.access);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccess();
  }, [resolvedLoanId, user]);

  // --- Loading State ---
  if (loading) {
    return <LoadingSpinner text={' Checking permissions...'} />;
  }

  // --- Error State ---
  if (error) {
    return <DataError title='Failed to check access' message={error} />;
  }

  // --- Unauthorized / Missing Access ---
  if (!access?.[requiredAccess]) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className='h-svh'>
        <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
          <h1 className='text-[7rem] leading-tight font-bold'>404</h1>
          <span className='font-medium'>Access Restricted</span>
          <p className='text-muted-foreground text-center'>
            You do not have permission to perform this action.
          </p>
          <div className='mt-6 flex gap-4'>
            <Button variant='outline' onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={() => navigate('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Authorized Access ---
  return <>{children}</>;
};
