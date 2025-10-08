import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { Building2, Percent, PiggyBank, TrendingUp, User } from 'lucide-react';
import type { ContributionSummary } from '../../shared/types/contributions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function ContributionStats({
  summary,
}: {
  summary: ContributionSummary;
}) {
  return (
    <Card className='mb-8'>
      <CardHeader className='mb-4 flex items-center gap-2 font-semibold'>
        <div className='bg-primary/10 rounded-lg p-2'>
          <TrendingUp className='h-5 w-5' />
        </div>
        <CardTitle className='text-lg'>Contributions Summary</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <BalanceCard
          label=' Total Contributions'
          value={formatCurrency(Number(summary?.total_contributions))}
          icon={PiggyBank}
        />
        <BalanceCard
          label='Total Employee Contributions'
          value={formatCurrency(Number(summary.total_employee))}
          icon={User}
        />
        <BalanceCard
          label='Total Employer Contributions'
          value={formatCurrency(Number(summary.total_employee))}
          icon={Building2}
        />
        <BalanceCard
          label='Monthly Average'
          value={formatCurrency(Number(summary.average_monthly))}
          icon={Percent}
          description={`Total contribution records: ${summary?.contribution_count}`}
        />
      </CardContent>
    </Card>
  );
}
