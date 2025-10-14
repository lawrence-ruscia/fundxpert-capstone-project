import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

interface ProjectionRecord {
  year: number;
  employee_contribution: number;
  employer_contribution: number;
  vested_amount: number;
  unvested_amount: number;
  total_balance: number;
  with_growth: number;
}

const chartConfig = {
  total_balance: {
    label: 'Total Balance',
    color: 'hsl(var(--chart-3))',
  },
  with_growth: {
    label: 'With Growth',
    color: 'hsl(var(--chart-4))',
  },
};

export const ProjectionChart = ({ data }: { data: ProjectionRecord[] }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const finalProjection = data[data.length - 1];
  const growthDifference =
    finalProjection?.with_growth - finalProjection?.total_balance || 0;
  const growthPercentage = finalProjection?.total_balance
    ? ((growthDifference / finalProjection.total_balance) * 100).toFixed(1)
    : '0';

  return (
    <Card className='from-card to-card/80 border-0 bg-gradient-to-br shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-foreground flex items-center gap-2 text-xl font-semibold'>
              <TrendingUp className='text-primary min-h-5 min-w-5' />
              Fund Growth Projection
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Track your provident fund growth over time
            </p>
          </div>
          <div className='text-right'>
            <div className='text-muted-foreground flex items-center gap-1 text-sm'>
              <DollarSign className='min-h-4 min-w-4' />
              Potential Growth
            </div>
            <div className='text-lg font-semibold text-green-400'>
              +{growthPercentage}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='h-[350px] w-full'>
          <ResponsiveContainer width='100%' height='100%'>
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray='3 3'
                className='stroke-border/50'
              />
              <XAxis
                dataKey='year'
                className='text-muted-foreground text-xs'
                tick={{ fontSize: 12 }}
              />
              <YAxis
                className='text-muted-foreground text-xs'
                tick={{ fontSize: 12 }}
                tickFormatter={value => `₱${(value / 1000000).toFixed(1)}M`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      formatCurrency(Number(value)),
                      ' ',
                      chartConfig[name as keyof typeof chartConfig]?.label ||
                        name,
                    ]}
                  />
                }
              />
              <Line
                type='monotone'
                dataKey='total_balance'
                stroke='var(--color-chart-4)'
                strokeWidth={3}
                dot={{ fill: 'var(--color-chart-4)', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: 'var(--color-chart-4)',
                  strokeWidth: 2,
                }}
              />
              <Line
                type='monotone'
                dataKey='with_growth'
                stroke='var(--color-chart-3)'
                strokeWidth={3}
                dot={{ fill: 'var(--color-chart-3)', strokeWidth: 2, r: 4 }}
                activeDot={{
                  r: 6,
                  stroke: 'var(--color-chart-3)',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
          <div className='rounded-lg border border-orange-500/20 bg-orange-500/10 p-4'>
            <div className='text-xs font-medium tracking-wide text-orange-500 uppercase'>
              Total Balance
            </div>
            <div className='text-foreground mt-1 text-lg font-semibold'>
              {formatCurrency(finalProjection?.total_balance || 0)}
            </div>
          </div>
          <div className='rounded-lg border border-violet-500/20 bg-violet-500/10 p-4'>
            <div className='text-xs font-medium tracking-wide text-violet-500 uppercase'>
              With Growth
            </div>
            <div className='text-foreground mt-1 text-lg font-semibold'>
              {formatCurrency(finalProjection?.with_growth || 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
