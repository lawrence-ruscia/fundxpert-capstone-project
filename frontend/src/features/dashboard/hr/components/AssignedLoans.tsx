import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FileText,
  Briefcase,
  CheckCircle,
  ChevronRight,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoanStatusBadge } from '@/features/loans/employee/components/LoanStatusBadge';
import { formatCurrency } from '../../employee/utils/formatters';
import type { HRRole } from '@/shared/types/user';

type LoanCategory = 'assistant' | 'officer' | 'approver';

interface Loan {
  id: string;
  employee_id: string;
  employee_name?: string;
  amount: string;
  status: string;
  created_at: string;
}

interface AssignedLoansProps {
  assignedLoans: {
    assistant?: Loan[];
    officer?: Loan[];
    approver?: Loan[];
  };
  userHrRole: HRRole;
}

export const AssignedLoans = ({
  assignedLoans,
  userHrRole,
}: AssignedLoansProps) => {
  // Define which loan categories each HR role can access
  const roleAccessMap: Record<HRRole, LoanCategory[]> = {
    BenefitsAssistant: ['assistant'],
    BenefitsOfficer: ['officer'],
    DeptHead: ['approver'], // Department heads can approve
    MgmtApprover: ['approver'],
    GeneralHR: ['assistant', 'officer', 'approver'],
  };

  const accessibleCategories = userHrRole ? roleAccessMap[userHrRole] : [];

  // Filter loan categories based on user's HR role
  const availableLoans = accessibleCategories.reduce(
    (acc, category) => {
      if (assignedLoans[category] && assignedLoans[category].length > 0) {
        acc[category] = assignedLoans[category];
      }
      return acc;
    },
    {} as Record<LoanCategory, Loan[]>
  );

  const [currentCategory, setCurrentCategory] = useState<LoanCategory>(
    (Object.keys(availableLoans)[0] as LoanCategory) || accessibleCategories[0]
  );

  const categoryConfig: Record<
    LoanCategory,
    {
      label: string;
      icon: typeof FileText;
      color: string;
      bgColor: string;
      borderColor: string;
      description: string;
    }
  > = {
    assistant: {
      label: 'Pre-Screen Review',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-muted',
      borderColor: 'text-muted-foreground',
      description: 'Initial application review and document verification',
    },
    officer: {
      label: 'Officer Review',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-muted',
      borderColor: 'text-muted-foreground',
      description: 'Detailed assessment and approval decision',
    },
    approver: {
      label: 'Pending Approval',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-muted',
      borderColor: 'text-muted-foreground',
      description: 'Sequential approval workflow for loan processing',
    },
  };

  const currentLoans = availableLoans[currentCategory] || [];
  const currentConfig = categoryConfig[currentCategory];
  const IconComponent = currentConfig?.icon || Clock;

  // Calculate total pending loans across all accessible categories
  const totalPendingLoans = Object.values(availableLoans).reduce(
    (sum, loans) => sum + loans.length,
    0
  );

  // If user has no accessible categories
  if (accessibleCategories.length === 0) {
    return (
      <section className='space-y-6'>
        <div className='flex items-center gap-3'>
          <Clock className='text-primary h-6 w-6' />
          <h2 className='text-2xl font-semibold'>Assigned Loans</h2>
        </div>
        <Card>
          <CardContent className='p-12 text-center'>
            <div className='bg-muted mb-4 inline-flex rounded-full p-4'>
              <Shield className='text-muted-foreground h-8 w-8' />
            </div>
            <h3 className='mb-2 text-lg font-semibold'>No Access</h3>
            <p className='text-muted-foreground text-sm'>
              Your HR role does not have loan review permissions.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Clock className='text-primary h-6 w-6' />
          <div>
            <h2 className='text-2xl font-semibold'>Assigned Loans</h2>
            <p className='text-muted-foreground text-sm'>
              Review and process loans based on your role
            </p>
          </div>
        </div>
        {totalPendingLoans > 0 && (
          <Badge variant='secondary' className='h-7 text-sm'>
            {totalPendingLoans} Pending
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className='p-6'>
          <Tabs
            value={currentCategory}
            onValueChange={value => setCurrentCategory(value as LoanCategory)}
            className='w-full'
          >
            {Object.keys(availableLoans).length > 1 && (
              <div className='mb-6 overflow-x-auto pb-2'>
                <TabsList className='bg-muted/50 inline-flex h-auto w-max min-w-full gap-2 p-1.5'>
                  {accessibleCategories
                    .filter(category => availableLoans[category])
                    .map(category => {
                      const config = categoryConfig[category];
                      const Icon = config.icon;
                      const count = availableLoans[category]?.length || 0;
                      const isActive = currentCategory === category;

                      return (
                        <TabsTrigger
                          key={category}
                          value={category}
                          className='data-[state=active]:bg-background relative flex items-center gap-2 rounded-md px-4 py-3 transition-all data-[state=active]:shadow-sm'
                        >
                          <Icon
                            className={`h-4 w-4 ${isActive ? config.color : 'text-muted-foreground'}`}
                          />
                          <span className='font-medium'>{config.label}</span>
                          <Badge
                            variant={isActive ? 'default' : 'secondary'}
                            className='ml-1 text-xs'
                          >
                            {count}
                          </Badge>
                        </TabsTrigger>
                      );
                    })}
                </TabsList>
              </div>
            )}

            {accessibleCategories.map(category => (
              <TabsContent
                key={category}
                value={category}
                className='mt-0 space-y-4'
              >
                {/* Category Description */}
                <div
                  className={`flex items-center gap-3 rounded-lg border ${currentConfig.borderColor} ${currentConfig.bgColor} p-4`}
                >
                  <IconComponent className={`h-5 w-5 ${currentConfig.color}`} />
                  <div>
                    <h3 className='text-primary text-sm font-semibold'>
                      {currentConfig.label}
                    </h3>
                    <p className='text-muted-foreground text-xs'>
                      {currentConfig.description}
                    </p>
                  </div>
                </div>

                {currentLoans.length === 0 ? (
                  <div className='flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center'>
                    <div className='bg-muted mb-4 rounded-full p-3'>
                      <IconComponent
                        className={`h-8 w-8 ${currentConfig.color}`}
                      />
                    </div>
                    <h3 className='mb-2 text-lg font-semibold'>
                      All Caught Up!
                    </h3>
                    <p className='text-muted-foreground text-sm'>
                      No pending loans in this category at the moment.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className='max-h-96 space-y-3 overflow-y-auto pr-2'>
                      {currentLoans.map(loan => (
                        <Link
                          key={loan.id}
                          to={`/hr/loans/${loan.id}/`}
                          className='group block'
                        >
                          <div className='hover:border-primary flex items-center justify-between rounded-lg border-2 p-4 transition-all hover:shadow-md'>
                            <div className='flex flex-1 items-start gap-4'>
                              <div
                                className={`rounded-lg p-2.5 ${currentConfig.bgColor} transition-transform group-hover:scale-110`}
                              >
                                <IconComponent
                                  className={`h-5 w-5 ${currentConfig.color}`}
                                />
                              </div>
                              <div className='flex-1 space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                  <h4 className='text-base font-semibold'>
                                    Loan #{loan.id}
                                  </h4>
                                  <LoanStatusBadge
                                    size='sm'
                                    status={loan.status}
                                  />
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <p className='text-muted-foreground text-sm'>
                                    Applied{' '}
                                    {new Date(loan.created_at).toLocaleString(
                                      'en-US',
                                      {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true,
                                      }
                                    )}
                                  </p>
                                  {loan.employee_id && (
                                    <>
                                      <span className='text-muted-foreground/50'>
                                        •
                                      </span>
                                      <span className='text-muted-foreground text-sm font-medium'>
                                        {loan.employee_id}
                                      </span>
                                    </>
                                  )}
                                  {loan.employee_name && (
                                    <>
                                      <span className='text-muted-foreground/50'>
                                        •
                                      </span>
                                      <span className='text-muted-foreground text-sm'>
                                        {loan.employee_name}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className='flex items-center gap-3'>
                              <div className='text-right'>
                                <p className='text-muted-foreground mb-1 text-xs font-medium'>
                                  Amount
                                </p>
                                <p className='text-lg font-bold'>
                                  {formatCurrency(Number(loan.amount))}
                                </p>
                              </div>
                              <ChevronRight className='text-muted-foreground group-hover:text-primary h-5 w-5 transition-transform group-hover:translate-x-1' />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    <Button variant='outline' className='group w-full' asChild>
                      <Link to='/hr/loans'>
                        View All Loans
                        <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
                      </Link>
                    </Button>
                  </>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};
