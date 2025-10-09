import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';
import type { WithdrawalAccess as WithdrawalAccessType } from '../../employee/types/withdrawal';
import { getWithdrawalAccess } from '../services/hrWithdrawalService';

interface WithdrawalAccessProps {
  withdrawalId?: number;
  requiredAccess: keyof WithdrawalAccessType;
  fallback?: React.ReactNode; // optional custom UI for denied access
  children: React.ReactNode;
}

export const WithdrawalAccess: React.FC<WithdrawalAccessProps> = ({
  withdrawalId,
  requiredAccess,
  fallback,
  children,
}) => {
  const { user } = useAuth();
  const params = useParams<{ withdrawalId: string }>();
  const navigate = useNavigate();
  const [access, setAccess] = useState<WithdrawalAccessType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedWithdrawalId = withdrawalId ?? Number(params.withdrawalId);

  useEffect(() => {
    if (!resolvedWithdrawalId || !user) return;

    async function fetchAccess() {
      try {
        setLoading(true);
        const res = await getWithdrawalAccess(resolvedWithdrawalId);
        setAccess(res.access);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    fetchAccess();
  }, [resolvedWithdrawalId, user]);

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
          <h1 className='text-[7rem] leading-tight font-bold'>403</h1>
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
