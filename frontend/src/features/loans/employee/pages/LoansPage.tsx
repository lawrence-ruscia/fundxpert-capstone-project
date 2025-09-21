import { fetchEmployeeLoans } from '../services/loanService';
import type { Loan } from '../types/loan';
import { useApi } from '@/hooks/useApi';
import { LoanApplicationForm } from '../components/LoanApplicationForm';
import { useState } from 'react';
import { useEmployeeOverview } from '@/features/dashboard/employee/hooks/useEmployeeOverview';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  AlertCircle,
  XCircle,
  ShieldCheck,
  PiggyBank,
  Wallet,
} from 'lucide-react';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { LoansList } from '../components/LoanList';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';

export default function LoansPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: loans,
    loading,
    error,
  } = useApi<Loan[]>(
    fetchEmployeeLoans,
    [refreshKey] // Add refreshKey as dependency
  );
  const {
    data: overview,
    loading: overviewLoading,
    error: overviewError,
  } = useEmployeeOverview();

  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Increment to trigger refetch
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Loading state
  if (loading || overviewLoading) {
    return <LoadingSpinner text={'Loading Employee Data'} />;
  }

  // Error state
  if (error || overviewError) {
    return (
      <ErrorMessage
        message={
          error?.message || overviewError?.message || 'An error occurred'
        }
      />
    );
  }

  // No overview data (shouldn't happen but good to handle)
  if (!overview) {
    return (
      <ErrorMessage message='Unable to load loan eligibility information' />
    );
  }

  const maxLoanAmount = overview.eligibility.max_loan_amount ?? 0;

  return (
    <div>
      {showForm ? (
        <div className='mt-8'>
          <Card className='border-0 shadow-xl'>
            <CardHeader>
              <CardTitle className='text-2xl'>New Loan Application</CardTitle>
              <CardDescription>
                Complete the form below to apply for a new loan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoanApplicationForm
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                maxLoan={maxLoanAmount}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className=''>
          {/* Header */}
          <div className='mb-8'>
            <div className='mb-2 flex items-center gap-3'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight'>
                  Loan Management
                </h1>
                <p className='text-muted-foreground'>
                  Manage your provident fund loans and applications
                </p>
              </div>
            </div>
          </div>

          {/* Overview Cards */}
          <div className='mb-8 grid grid-cols-1 gap-6 md:grid-cols-3'>
            <BalanceCard
              label='Vested Amount'
              value={formatCurrency(Number(overview.balances.vested_amount))}
              icon={ShieldCheck}
            />

            <BalanceCard
              label='Total Balance'
              value={formatCurrency(Number(overview.balances.total_balance))}
              icon={PiggyBank}
            />

            <BalanceCard
              label='Max Loan Amount'
              value={formatCurrency(maxLoanAmount)}
              icon={Wallet}
              comparison={
                overview.eligibility.can_request_loan
                  ? 'Eligible for loan'
                  : 'Not eligible'
              }
            />
          </div>

          {/* Main Content */}
          <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
            {/* Loans List */}
            <div className='lg:col-span-2'>
              <LoansList loans={loans || []} />
            </div>

            {/* Sidebar */}
            <div className='space-y-6'>
              {/* Apply for Loan Card */}
              <Card className='lg:sticky lg:top-8'>
                <CardHeader>
                  <CardTitle className='text-xl font-semibold'>
                    Need a Loan?
                  </CardTitle>
                  <CardDescription>
                    Apply for a new loan against your provident fund balance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!showForm ? (
                    <Button
                      onClick={() => setShowForm(true)}
                      className='w-full'
                      // disabled={!overview.eligibility.can_request_loan}
                    >
                      <Plus className='mr-2 h-4 w-4' />
                      Apply for New Loan
                    </Button>
                  ) : (
                    <div className='space-y-4'>
                      <p className='text-muted-foreground text-sm'>
                        Fill out the application form below:
                      </p>
                      <Button
                        variant='outline'
                        onClick={handleFormCancel}
                        className='w-full bg-transparent'
                      >
                        Cancel Application
                      </Button>
                    </div>
                  )}

                  {!overview.eligibility.can_request_loan && (
                    <Alert className='mt-4 border-amber-200 bg-amber-50 text-amber-800'>
                      <AlertCircle className='h-4 w-4 text-amber-800' />
                      <AlertDescription className='text-amber-800'>
                        You are currently not eligible for a loan.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Form Modal/Section */}
          {showForm && (
            <div className='mt-8'>
              <Card className='shadow-xl'>
                <CardHeader>
                  <CardTitle className='text-2xl'>
                    New Loan Application
                  </CardTitle>
                  <CardDescription>
                    Complete the form below to apply for a new loan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LoanApplicationForm
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                    maxLoan={maxLoanAmount}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4'>
      <Alert className='max-w-md border-red-200 bg-red-50'>
        <XCircle className='h-4 w-4 text-red-600' />
        <AlertDescription className='font-medium text-red-800'>
          {message}
        </AlertDescription>
      </Alert>
    </div>
  );
}
