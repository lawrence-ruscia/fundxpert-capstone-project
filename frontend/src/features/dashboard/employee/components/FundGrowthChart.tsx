import * as React from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { useIsMobile } from '@/hooks/use-mobile';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useEffect, useMemo, useState } from 'react';
import { useEmployeeContributions } from '@/features/contributions/employee/hooks/useEmployeeContributions';
import type { ContributionPeriod } from '@/features/contributions/employee/types/employeeContributions';

export const description = 'An interactive area chart';

const chartConfig = {
  employee: {
    label: 'Employee',
    color: 'var(--chart-1)',
  },
  employer: {
    label: 'Employer',
    color: 'var(--chart-2)',
  },
  vested: {
    label: 'Vested',
    color: 'var(--chart-3)',
  },
  total: {
    label: 'Total',
    color: 'var(--chart-4)',
  },
};

export function FundGrowthChart() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState('year');
  const {
    data: contributionsData,
    loading,
    error,
  } = useEmployeeContributions('all');

  useEffect(() => {
    if (isMobile) {
      setTimeRange('3m');
    }
  }, [isMobile]);

  const transformedData = useMemo(() => {
    if (!contributionsData?.contributions) {
      return [];
    }

    return contributionsData.contributions
      .map(record => ({
        // Create a proper date string from month and year
        date: `${record.year}-${record.month.padStart(2, '0')}-01`,
        employee: record.employee,
        employer: record.employer,
        vested: record.vested,
        total: record.total,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [contributionsData]);

  const filteredData = useMemo(() => {
    if (!transformedData.length) return [];

    if (timeRange === 'all') {
      return transformedData;
    }

    const now = new Date();
    let monthsToSubtract = 3;

    const startOfYear = new Date(now.getFullYear(), 0, 1);

    switch (timeRange) {
      case 'year':
        return transformedData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= startOfYear;
        });
      case '1y':
        monthsToSubtract = 13;
        break;
      case '6m':
        monthsToSubtract = 7;
        break;
      case '3m':
      default:
        monthsToSubtract = 4;
        break;
    }

    const startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() - monthsToSubtract);

    return transformedData.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [transformedData, timeRange]);

  const getTimeRangeLabel = (range: ContributionPeriod) => {
    switch (range) {
      case 'all':
        return 'All Time';
      case 'year':
        return 'Current Year';
      case '1y':
        return 'Last Year';
      case '6m':
        return 'Last 6 Months';
      case '3m':
        return 'Last 3 Months';
      default:
        return 'Last 3 Months';
    }
  };

  // Calculate dynamic total based on filtered data
  const latestTotal = useMemo(() => {
    if (timeRange === 'all') {
      return contributionsData?.totals.grand_total ?? 0;
    }

    // Calculate cumulative total from filtered data
    if (filteredData.length > 0) {
      return filteredData.reduce((sum, entry) => {
        return sum + entry.employee + entry.employer + entry.vested;
      }, 0);
    }

    return 0;
  }, [filteredData, timeRange, contributionsData?.totals.grand_total]);

  if (loading) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Provident Fund Growth</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='flex h-[350px] items-center justify-center'>
            <div className='text-muted-foreground'>Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Provident Fund Growth</CardTitle>
          <CardDescription>Error loading chart data</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='flex h-[350px] items-center justify-center'>
            <div className='text-destructive'>Failed to load data</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Provident Fund Growth</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Total fund value: ₱{latestTotal.toLocaleString()} (
            {getTimeRangeLabel(timeRange as ContributionPeriod)})
          </span>
          <span className='@[540px]/card:hidden'>
            ₱{latestTotal.toLocaleString()}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type='single'
            value={timeRange}
            onValueChange={(value: ContributionPeriod) =>
              value && setTimeRange(value)
            }
            variant='outline'
            className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'
          >
            <ToggleGroupItem value='all'>All Time</ToggleGroupItem>
            <ToggleGroupItem value='year'>Current Year</ToggleGroupItem>
            <ToggleGroupItem value='1y'>Last Year</ToggleGroupItem>
            <ToggleGroupItem value='6m'>Last 6 Months</ToggleGroupItem>
            <ToggleGroupItem value='3m'>Last 3 Months</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value: ContributionPeriod) => setTimeRange(value)}
          >
            <SelectTrigger
              className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
              size='sm'
              aria-label='Select a value'
            >
              <SelectValue
                placeholder={getTimeRangeLabel(timeRange as ContributionPeriod)}
              />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='all' className='rounded-lg'>
                All Time
              </SelectItem>
              <SelectItem value='year' className='rounded-lg'>
                Current Year
              </SelectItem>
              <SelectItem value='1y' className='rounded-lg'>
                Last Year
              </SelectItem>
              <SelectItem value='6m' className='rounded-lg'>
                Last 6 Months
              </SelectItem>
              <SelectItem value='3m' className='rounded-lg'>
                Last 3 Months
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        {filteredData.length === 0 ? (
          <div className='flex h-[350px] items-center justify-center'>
            <div className='text-muted-foreground'>
              No data available for the selected period
            </div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[350px] w-full'
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id='fillEmployee' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--chart-1)'
                    stopOpacity={1.0}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--chart-1)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id='fillEmployer' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--chart-2)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--chart-2)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id='fillVested' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset='5%'
                    stopColor='var(--chart-3)'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset='95%'
                    stopColor='var(--chart-3)'
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={true}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={value => {
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    year: '2-digit',
                  });
                }}
              />
              <YAxis />
              <ChartTooltip
                cursor={false}
                defaultIndex={isMobile ? -1 : filteredData.length - 1}
                content={
                  <ChartTooltipContent
                    labelFormatter={value => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      });
                    }}
                    indicator='dot'
                  />
                }
              />

              <ChartLegend content={<ChartLegendContent />} />

              <Area
                dataKey='employee'
                type='natural'
                fill='url(#fillEmployee)'
                stroke='var(--chart-1)'
                stackId='a'
              />
              <Area
                dataKey='employer'
                type='natural'
                fill='url(#fillEmployer)'
                stroke='var(--chart-2)'
                stackId='a'
              />
              <Area
                dataKey='vested'
                type='natural'
                fill='url(#fillVested)'
                stroke='var(--chart-3)'
                stackId='a'
              />
              <Area
                dataKey='total'
                type='natural'
                fill='none'
                stroke='var(--chart-4)'
                strokeWidth={2}
                strokeDasharray='5 5'
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
