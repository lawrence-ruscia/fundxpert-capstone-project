import { useEmployeeOverview } from '../hooks/useEmployeeOverview';
import { Header } from '@/shared/layout/Header';
import { Main } from '@/shared/layout/Main';
import { BalanceCard } from '../components/BalanceCard';
import { ThemeSwitch } from '@/shared/components/theme-switch';
import { ProfileDropdown } from '@/shared/components/profile-dropdown';
import { EmploymentStatusBadge } from '../components/EmployeeStatusBadge';
import {
  formatCurrency,
  formatGrowth,
  formatVesting,
  formatVestingDate,
} from '../utils/formatters';
import { Building2, Clock, PiggyBank, ShieldCheck, User } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { FundGrowthChart } from '../components/FundGrowthChart';
import { QuickActions } from '../components/QuickActions';

export default function EmployeeDashboard() {
  const { data: overview, loading, error } = useEmployeeOverview();

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: 'red' }}>❌ {error.message}</p>;
  if (!overview) return <p>No data available</p>;

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>
              Welcome back, {overview.employee.name} !
            </h1>
            <div className='flex gap-6'>
              <p>
                <span className='text-muted-foreground'>Employee ID: </span>
                {overview.employee.employee_id}
              </p>
              <p>
                <span className='text-muted-foreground'>Hired: </span>
                {new Date(overview.employee.date_hired).toLocaleDateString(
                  'en-US',
                  {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }
                )}
              </p>
            </div>
          </div>
          <div className='flex flex-col justify-center space-x-2 tracking-tight'>
            <EmploymentStatusBadge
              status={overview.employee.employment_status}
            />
          </div>
        </div>
        <div className='space-y-4'>
          <div className='space-y-4'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5'>
              <BalanceCard
                label='Employee Contributions'
                value={formatCurrency(
                  overview.balances.employee_contribution_total
                )}
                icon={User}
              />
              <BalanceCard
                label='Employer Contributions'
                value={formatCurrency(
                  overview.balances.employer_contribution_total
                )}
                icon={Building2}
              />
              <BalanceCard
                label='Vested Amount'
                value={formatCurrency(overview.balances.vested_amount)}
                icon={ShieldCheck}
                comparison={formatVesting(
                  Number(overview.balances.comparisons.vesting_percentage)
                )}
              />
              <BalanceCard
                label='Unvested Amount'
                value={formatCurrency(overview.balances.unvested_amount)}
                icon={Clock}
                comparison={formatVestingDate(
                  overview.employee.date_hired,
                  overview.balances.unvested_amount
                )}
              />
              <BalanceCard
                label='Total Balance'
                value={formatCurrency(overview.balances.total_balance)}
                icon={PiggyBank}
                comparison={formatGrowth(
                  Number(overview.balances.comparisons.growth_percentage)
                )}
              />
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <div className='col-span-1 lg:col-span-5'>
                <div>
                  <FundGrowthChart />
                </div>
              </div>

              <QuickActions className='col-span-1 lg:col-span-2' />
            </div>
          </div>
        </div>
      </Main>
    </>
  );
}
