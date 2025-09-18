import { useState } from 'react';
import { projectionService } from '../services/projectionService';
import type { ProjectionResponse } from '../types/projectionTypes';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { Calculator } from 'lucide-react';
import ProjectionTable from '../components/ProjectionTable';
import { ProjectionChart } from '../components/ProjectionChart';
import {
  ProjectionParameters,
  type ProjectionSchema,
} from '../components/ProjectionParameters';

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
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='from-background via-muted/20 to-background min-h-screen bg-gradient-to-br'>
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='mb-8'>
          <div className='mb-4 flex items-center gap-3'>
            <div className='bg-primary rounded-xl p-3 shadow-lg'>
              <Calculator className='text-primary-foreground h-8 w-8' />
            </div>
            <div>
              <h1 className='text-foreground text-3xl font-bold'>
                Fund Projection Calculator
              </h1>
              <p className='text-muted-foreground mt-1'>
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
                <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        Final Balance
                      </div>
                      <div className='text-foreground text-lg font-bold'>
                        ₱{data.totals.final_balance}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        With Growth
                      </div>
                      <div className='text-lg font-bold text-green-600'>
                        ₱{data.totals.final_with_growth}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        Employee Total
                      </div>
                      <div className='text-lg font-bold text-blue-600'>
                        ₱{data.totals.employee}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className='p-4'>
                      <div className='text-muted-foreground mb-1 text-sm'>
                        Employer Total
                      </div>
                      <div className='text-lg font-bold text-purple-600'>
                        ₱{data.totals.employer}
                      </div>
                    </CardContent>
                  </Card>
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
