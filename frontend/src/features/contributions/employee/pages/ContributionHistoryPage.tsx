import { useState } from 'react';
import {
  Calendar,
  Loader2,
  User,
  Building2,
  ShieldCheck,
  PiggyBank,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { ContributionHistoryTable } from '../components/ContributionHistoryTable';
import { useEmployeeContributions } from '../hooks/useEmployeeContributions';
import type {
  ContributionPeriod,
  EmployeeContributionsResponse,
} from '../types/employeeContributions';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const periodOptions = [
  {
    value: 'all',
    label: 'All Time',
    description: 'Complete contribution history since enrollment',
  },
  {
    value: 'year',
    label: 'Current Year',
    description: `Year-to-date contributions for ${new Date(Date.now()).getFullYear()}`,
  },
  {
    value: '1y',
    label: 'Last Year',
    description: 'Previous 12 months of contribution data',
  },
  {
    value: '6m',
    label: 'Last 6 Months',
    description: 'Semi-annual view of your contributions',
  },
  {
    value: '3m',
    label: 'Last 3 Months',
    description: 'Recent contributions from the past 90 days',
  },
] as const;

function ContributionStats({
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

export default function ContributionHistoryPage() {
  const [period, setPeriod] = useState<ContributionPeriod>('year');
  const { data, loading, error } = useEmployeeContributions(period);

  const selectedPeriodOption = periodOptions.find(
    option => option.value === period
  );

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>Loading contributions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='container mx-auto p-6'>
        <Alert>
          <AlertDescription>No contribution data available.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight'>
            Contribution History
          </h1>
          <p className='text-muted-foreground'>
            Track your provident fund contributions and growth over time
          </p>
        </div>

        <div className='flex items-center space-x-2'>
          <Badge className='bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-semibold shadow-xs transition-colors'>
            <div className='flex items-center gap-2'>
              <Calendar size={20} />
              <p>{selectedPeriodOption?.label}</p>
            </div>
          </Badge>
        </div>
      </div>

      {/* Period Selection */}
      <Card className='@container/card'>
        <CardHeader className='flex items-center justify-between'>
          <div>
            <CardTitle className='text-lg'>Time Period</CardTitle>
            <CardDescription>
              {selectedPeriodOption && (
                <p className='text-muted-foreground text-sm'>
                  {selectedPeriodOption.description}
                </p>
              )}
            </CardDescription>
          </div>
          <Calendar />
        </CardHeader>
        <CardContent>
          <div className='flex flex-col space-y-2'>
            <ToggleGroup
              type='single'
              value={period}
              onValueChange={value => setPeriod(value as ContributionPeriod)}
              variant='outline'
              className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'
            >
              {periodOptions.map(option => (
                <ToggleGroupItem key={option.value} value={option.value}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <Select
              value={period}
              onValueChange={value => setPeriod(value as ContributionPeriod)}
            >
              <SelectTrigger
                className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
                size='sm'
                aria-label='Select a value'
              >
                <SelectValue placeholder='Select time period' />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <ContributionStats contributionData={data} />

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>
            Detailed Contribution History
          </CardTitle>
          <CardDescription>
            Monthly breakdown of your contributions for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionHistoryTable data={data} />
        </CardContent>
      </Card>
    </div>
  );
}
