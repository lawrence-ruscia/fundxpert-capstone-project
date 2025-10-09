import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ArrowRight,
  FileText,
  Briefcase,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '../../employee/utils/formatters';
import type { Loan } from '@/features/loans/employee/types/loan';
import { LoanStatusBadge } from '@/features/loans/employee/components/LoanStatusBadge';

export const AssignedLoans = ({
  assignedLoans,
}: {
  assignedLoans: {
    assistant: Loan[];
    officer: Loan[];
    approver: Loan[];
  };
}) => {
  const [currentRole, setCurrentRole] = useState<
    'assistant' | 'officer' | 'approver'
  >('assistant');

  const roleConfig = {
    assistant: {
      label: 'As Assistant',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'text-muted-foreground',
      borderColor: 'text-secondary',
    },
    officer: {
      label: 'As Officer',
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'text-muted-foreground',
      borderColor: 'text-secondary',
    },
    approver: {
      label: 'As Approver',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'text-muted-foreground',
      borderColor: 'text-secondary',
    },
  };

  const currentLoans = assignedLoans[currentRole];
  const currentConfig = roleConfig[currentRole];
  const IconComponent = currentConfig.icon;

  return (
    <section className='space-y-6'>
      <div className='flex items-center gap-3'>
        <Clock className='text-primary h-6 w-6' />
        <h2 className='text-2xl font-semibold'>Assigned Loans</h2>
      </div>

      <Card>
        <CardContent className='p-6'>
          <Tabs
            value={currentRole}
            onValueChange={value =>
              setCurrentRole(value as 'assistant' | 'officer' | 'approver')
            }
            className='w-full'
          >
            <div className='overflow-x-auto pb-2'>
              <TabsList className='bg-muted/50 inline-flex h-auto w-max min-w-full gap-2 p-1.5 lg:grid lg:w-full lg:grid-cols-3'>
                {(
                  Object.keys(roleConfig) as Array<keyof typeof roleConfig>
                ).map(role => {
                  const config = roleConfig[role];
                  const Icon = config.icon;
                  const count = assignedLoans[role].length;
                  const isActive = currentRole === role;

                  return (
                    <TabsTrigger
                      key={role}
                      value={role}
                      className={`data-[state=active]:bg-background } flex items-center gap-2 rounded-md px-4 py-3 transition-all data-[state=active]:shadow-sm`}
                    >
                      <Icon
                        className={`h-4 w-4 ${isActive ? config.color : 'text-muted-foreground'}`}
                      />
                      <span className='font-medium'>{config.label}</span>
                      <Badge
                        variant={isActive ? 'default' : 'secondary'}
                        className='ml-auto text-xs'
                      >
                        {count}
                      </Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value={currentRole} className='mt-6 space-y-4'>
              {currentLoans.length === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center ${currentConfig.borderColor} ${currentConfig.bgColor}`}
                >
                  <div
                    className={`rounded-full p-3 ${currentConfig.bgColor} mb-4`}
                  >
                    <IconComponent
                      className={`h-8 w-8 ${currentConfig.color}`}
                    />
                  </div>
                  <h3 className='mb-2 text-lg font-semibold'>
                    No Pending Loans
                  </h3>
                  <p className='text-muted-foreground text-sm'>
                    You don't have any loans assigned to you as{' '}
                    {currentConfig.label.toLowerCase()}.
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
                              className={`rounded-lg p-2.5 ${currentConfig.bgColor} transition-colors group-hover:scale-110`}
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
                                  status={loan.status}
                                  size='sm'
                                />
                              </div>
                              <div className='flex flex-wrap items-center gap-2'>
                                <p className='text-muted-foreground text-sm'>
                                  Applied on{' '}
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
                                <span className='text-muted-foreground/50'>
                                  •
                                </span>
                                <span className='text-muted-foreground text-sm'>
                                  EMP ({loan.employee_id})
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className='flex items-center gap-3'>
                            <div className='text-right'>
                              <p className='text-muted-foreground mb-1 text-xs'>
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
                      View All Pending Loans
                      <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
                    </Link>
                  </Button>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
};
