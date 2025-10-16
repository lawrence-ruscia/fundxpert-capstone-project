import { useState } from 'react';
import { projectionService } from '../services/projectionService';
import type { ProjectionResponse } from '../types/projectionTypes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import {
  Building2,
  Calculator,
  PiggyBank,
  TrendingUp,
  User,
} from 'lucide-react';
import ProjectionTable from '../components/ProjectionTable';
import { ProjectionChart } from '../components/ProjectionChart';
import {
  ProjectionParameters,
  type ProjectionSchema,
} from '../components/ProjectionParameters';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

export default function FundProjectionPage() {
  const [data, setData] = useState<ProjectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (formData: ProjectionSchema) => {
    try {
      setLoading(true);
      const result = await projectionService.getProjection(formData);
      setData(result);
    } catch (err) {
      console.error('Projection failed', err);
      setError(getErrorMessage(err, 'Projection failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold tracking-tight'>
                Fund Projection Tool
              </h1>
              <p className='text-muted-foreground'>
                Plan your retirement with confidence
              </p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='lg:col-span-1'>
            <ProjectionParameters
              onSubmit={onSubmit}
              loading={loading}
              error={error ?? ''}
            />
          </div>

          <div className='lg:col-span-2'>
            {loading ? (
              <Card className='from-card to-card/80 border-0 bg-gradient-to-br py-12 text-center shadow-lg'>
                <CardContent>
                  <div className='bg-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                    <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
                  </div>
                  <h3 className='text-foreground mb-2 text-xl font-semibold'>
                    Calculating Your Projections
                  </h3>
                  <p className='text-muted-foreground'>
                    Please wait while we process your fund growth
                    calculations...
                  </p>
                </CardContent>
              </Card>
            ) : data ? (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                  <BalanceCard
                    label='Employee Total'
                    value={formatCurrency(data.totals.employee)}
                    icon={User}
                  />
                  <BalanceCard
                    label='Employer Total'
                    value={formatCurrency(data.totals.employer)}
                    icon={Building2}
                  />
                  <BalanceCard
                    label='Final Balance'
                    value={formatCurrency(data.totals.final_balance)}
                    icon={PiggyBank}
                  />
                  <BalanceCard
                    label='With Growth'
                    value={formatCurrency(data.totals.final_with_growth)}
                    icon={TrendingUp}
                  />
                </div>

                <Card className='border-0 shadow-lg'>
                  <CardHeader>
                    <CardTitle>Projection Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue='chart' className='w-full'>
                      <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value='chart'>Chart View</TabsTrigger>
                        <TabsTrigger value='table'>Table View</TabsTrigger>
                      </TabsList>
                      <TabsContent value='chart' className='mt-6'>
                        <ProjectionChart data={data.projection} />
                      </TabsContent>
                      <TabsContent value='table' className='mt-6'>
                        <ProjectionTable
                          data={data.projection}
                          totals={data.totals}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className='from-card to-card/80 border-0 bg-gradient-to-br py-12 text-center shadow-lg'>
                <CardContent>
                  <div className='bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full'>
                    <Calculator className='text-muted-foreground h-8 w-8' />
                  </div>
                  <h3 className='text-foreground mb-2 text-xl font-semibold'>
                    Ready to Calculate
                  </h3>
                  <p className='text-muted-foreground'>
                    Enter your projection parameters and click calculate to see
                    your fund growth projections.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
