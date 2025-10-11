import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
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
import type { LoginTrend } from '../types/admin';

interface LoginTrendsChartProps {
  login_trends: LoginTrend[];
}

const chartConfig = {
  success_count: {
    label: 'Successful Logins',
    color: 'hsl(142, 76%, 36%)', // green-600
  },
  failed_count: {
    label: 'Failed Logins',
    color: 'hsl(0, 84%, 60%)', // red-500
  },
};

export function LoginTrendsChart({ login_trends }: LoginTrendsChartProps) {
  if (!login_trends || login_trends.length === 0) {
    return (
      <Card className='@container/card'>
        <CardHeader>
          <CardTitle>Login Trends</CardTitle>
          <CardDescription>Last 7 days of login activity</CardDescription>
        </CardHeader>
        <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
          <div className='flex h-[350px] items-center justify-center'>
            <div className='text-muted-foreground'>No data available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalSuccess = login_trends.reduce(
    (sum, item) => sum + item.success_count,
    0
  );
  const totalFailed = login_trends.reduce(
    (sum, item) => sum + item.failed_count,
    0
  );

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Login Trends</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>
            Last 7 days: {totalSuccess.toLocaleString()} successful,{' '}
            {totalFailed.toLocaleString()} failed logins
          </span>
          <span className='@[540px]/card:hidden'>Last 7 days</span>
        </CardDescription>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[200px] w-full'
        >
          <LineChart data={login_trends}>
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
                  day: 'numeric',
                });
              }}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value => {
                    return new Date(value).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    });
                  }}
                  formatter={(value, name) => {
                    return [
                      <div className='flex items-center gap-2' key={name}>
                        <div
                          className='h-2.5 w-2.5 shrink-0 rounded-[2px]'
                          style={{
                            backgroundColor:
                              chartConfig[name as keyof typeof chartConfig]
                                ?.color,
                          }}
                        />
                        <div className='flex flex-1 items-center justify-between gap-1'>
                          <span className='text-muted-foreground'>
                            {chartConfig[name as keyof typeof chartConfig]
                              ?.label || name}
                          </span>
                          <span className='text-foreground font-mono font-medium tabular-nums'>
                            {Number(value).toLocaleString()}
                          </span>
                        </div>
                      </div>,
                    ];
                  }}
                  indicator='dot'
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey='success_count'
              type='monotone'
              stroke='var(--color-success_count)'
              strokeWidth={3}
              dot={{
                fill: 'var(--color-success_count)',
                r: 5,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              activeDot={{ r: 7 }}
            />
            <Line
              dataKey='failed_count'
              type='monotone'
              stroke='var(--color-failed_count)'
              strokeWidth={3}
              dot={{
                fill: 'var(--color-failed_count)',
                r: 5,
                strokeWidth: 2,
                stroke: 'hsl(var(--background))',
              }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
