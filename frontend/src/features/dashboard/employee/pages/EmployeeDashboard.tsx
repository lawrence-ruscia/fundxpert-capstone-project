import { useEmployeeOverview } from '../hooks/useEmployeeOverview';
import { Header } from '@/shared/layout/Header';
import { Main } from '@/shared/layout/Main';
import { EmployeeContributions } from '../components/EmployeeContributions';
import { EmployerContributions } from '../components/EmployerContributions';
import { ThemeSwitch } from '@/shared/components/theme-switch';
import { ProfileDropdown } from '@/shared/components/profile-dropdown';
import { VestedAmount } from '../components/VestedAmount';
import { UnvestedAmount } from '../components/UnvestedAmount';
import { TotalBalance } from '../components/TotalBalance';

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
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
          <div className='flex items-center space-x-2'></div>
        </div>
        <div className='space-y-4'>
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <EmployeeContributions
                value={overview.balances.employee_contribution_total ?? 0}
              />
              <EmployerContributions
                value={overview.balances.employer_contribution_total ?? 0}
              />
              <VestedAmount value={overview.balances.vested_amount ?? 0} />
              <UnvestedAmount value={overview.balances.unvested_amount ?? 0} />
              <TotalBalance value={overview.balances.total_balance ?? 0} />
            </div>
            {/* <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                  <CardDescription>
                    You made 265 sales this month.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div> */}
          </div>
        </div>
      </Main>
    </>
  );
}
