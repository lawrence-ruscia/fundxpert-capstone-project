import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AreaChart } from 'recharts';
import { useState, useEffect, useMemo } from 'react';
import { CartesianGrid, XAxis, YAxis, Area } from 'recharts';
import type { HRContributionPeriod } from '../types/hrDashboardTypes';
import { useIsMobile } from '@/hooks/use-mobile';
import { useContributionTrends } from '../hooks/useContributionTrends';

const chartConfig = {
  employee: {
    label: 'Employee',
    color: 'var(--chart-1)',
  },
  employer: {
    label: 'Employer',
    color: 'var(--chart-2)',
  },
  total: {
    label: 'Total',
    color: 'var(--chart-3)',
  },
};

export function ContributionTrends() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = useState<HRContributionPeriod>('year');

  const { data: contributions, loading, error } = useContributionTrends('all');

  const transformedData = useMemo(() => {
    if (!contributions?.contributions) {
      return [];
    }

    return contributions.contributions
      .map(record => ({
        // Create a proper date string from month and year
        date: `${record.year}-${record.month.padStart(2, '0')}-01`,
        employee: record.employee,
        employer: record.employer,
        total: record.total,
        // Format display labels
        monthYear: `${record.month}/${record.year}`,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [contributions?.contributions]);

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

  const latestTotal = useMemo(() => {
    if (timeRange === 'all') {
      return contributions?.totals.grand_total ?? 0;
    }

    // Calculate cumulative total from filtered data
    if (filteredData.length > 0) {
      return filteredData.reduce((sum, entry) => {
        return sum + entry.employee + entry.employer;
      }, 0);
    }

    return 0;
  }, [filteredData, timeRange, contributions?.totals.grand_total]);

  const getTimeRangeLabel = (range: HRContributionPeriod) => {
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
        return 'Current Year';
    }
  };

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
        <CardTitle>Contribution Trends</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Total contributions: ₱{latestTotal.toLocaleString()} (
            {getTimeRangeLabel(timeRange)})
          </span>
          <span className='@[540px]/card:hidden'>
            ₱{latestTotal.toLocaleString()}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type='single'
            value={timeRange}
            onValueChange={(value: HRContributionPeriod) =>
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
            onValueChange={(value: HRContributionPeriod) => setTimeRange(value)}
          >
            <SelectTrigger
              className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
              size='sm'
              aria-label='Select a value'
            >
              <SelectValue placeholder={getTimeRangeLabel(timeRange)} />
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
        {transformedData.length === 0 ? (
          <div className='flex h-[350px] items-center justify-center'>
            <div className='text-muted-foreground'>
              No data available for the selected period
            </div>
          </div>
        ) : (
          <>
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
                      stopOpacity={0.8}
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
                <YAxis
                  tickFormatter={value => `₱${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip
                  cursor={false}
                  defaultIndex={isMobile ? -1 : transformedData.length - 1}
                  content={
                    <ChartTooltipContent
                      labelFormatter={value => {
                        return new Date(value).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric',
                        });
                      }}
                      formatter={(value, name) => [
                        `₱${Number(value).toLocaleString()}`,
                        chartConfig[name as keyof typeof chartConfig]?.label ||
                          name,
                      ]}
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
                  dataKey='total'
                  type='natural'
                  fill='none'
                  stroke='var(--chart-3)'
                  strokeWidth={2}
                  strokeDasharray='5 5'
                />
              </AreaChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
