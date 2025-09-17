import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { Building2, PiggyBank, ShieldCheck, User } from 'lucide-react';
import type { EmployeeContributionsResponse } from '../types/employeeContributions';

export function ContributionStats({
  contributionData,
}: {
  contributionData: EmployeeContributionsResponse;
}) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      <BalanceCard
        label='Employee Contributions'
        value={formatCurrency(contributionData.totals.employee)}
        icon={User}
      />
      <BalanceCard
        label='Employer Contributions'
        value={formatCurrency(contributionData.totals.employee)}
        icon={Building2}
      />
      <BalanceCard
        label='Vested Amount'
        value={formatCurrency(contributionData.totals.vested)}
        icon={ShieldCheck}
      />
      <BalanceCard
        label='Total Balance'
        value={formatCurrency(contributionData.totals.grand_total)}
        icon={PiggyBank}
      />
    </div>
  );
}
