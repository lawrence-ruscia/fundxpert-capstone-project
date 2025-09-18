import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { fetchEmployeeOverview } from '@/features/dashboard/employee/services/employeeService.js';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

import {
  Target,
  Calendar,
  TrendingUp,
  DollarSign,
  Info,
  Calculator,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrencyInput } from '@/shared/components/currency-input';
import { PercentInput } from '@/shared/components/percent-input';
import { useEffect, useState } from 'react';

const projectionSchema = z.object({
  years: z.number().min(1).max(30),
  growthRate: z.number().min(0).max(0.2), // up to 20% for safety
  salaryOverride: z
    .number()
    .refine(val => val === undefined || (typeof val === 'number' && val >= 0), {
      message: 'Salary Override must be a positive number',
    })
    .optional(),
});

export type ProjectionSchema = z.infer<typeof projectionSchema>;

type ParamsProps = {
  onSubmit: (formData: ProjectionSchema) => void;
  loading: boolean;
  error: string;
};

export const ProjectionParameters = ({
  onSubmit,
  loading,
  error,
}: ParamsProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    control,
  } = useForm<ProjectionSchema>({
    resolver: zodResolver(projectionSchema),
    defaultValues: {
      years: 10,
      growthRate: 0.03,
      salaryOverride: undefined,
    },
  });

  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const overview = await fetchEmployeeOverview();
        if (overview?.employee?.salary) {
          setValue('salaryOverride', Number(overview.employee.salary)); // pre-fill
        }
      } catch (err) {
        console.error('Failed to fetch employee overview:', err);
      } finally {
        setInitializing(false);
      }
    }
    fetchEmployee();
  }, [setValue]);

  const watchedYears = watch('years');

  if (initializing) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex min-h-[400px] items-center justify-center'>
          <div className='flex flex-col items-center space-y-4'>
            <Loader2 className='text-primary h-8 w-8 animate-spin' />
            <p className='text-muted-foreground'>Loading employee data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className='lg:sticky lg:top-8'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Target className='text-primary h-5 w-5' />
          Projection Parameters
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div>
            <Label className='mb-2 flex items-center gap-2 text-sm font-medium'>
              <Calendar className='h-4 w-4' />
              Investment Period
            </Label>
            <div className='space-y-3'>
              <Slider
                value={[watchedYears]}
                onValueChange={value => setValue('years', value[0])}
                max={30}
                min={1}
                step={1}
                className='w-full'
                disabled={loading}
              />
              <div className='text-muted-foreground flex justify-between text-xs'>
                <span>1 year</span>
                <span className='text-primary font-semibold'>
                  {watchedYears} years
                </span>
                <span>30 years</span>
              </div>
            </div>
            {errors.years && (
              <p className='text-destructive mt-1 text-sm'>
                {errors.years.message}
              </p>
            )}
          </div>

          <div>
            <Label className='mb-2 flex items-center gap-2 text-sm font-medium'>
              <TrendingUp className='h-4 w-4' />
              Expected Annual Growth
            </Label>
            <div className='relative'>
              <PercentInput
                step={0.01}
                {...register('growthRate', {
                  min: 0,
                  max: 0.2,
                  valueAsNumber: true,
                })}
                max={0.2}
                min={0}
                className='pr-8'
                placeholder='0.03'
                disabled={loading}
              />
            </div>
            {errors.growthRate && (
              <p className='text-destructive mt-1 text-sm'>
                {errors.growthRate.message}
              </p>
            )}
            <p className='text-muted-foreground mt-1 text-xs'>
              Conservative: 0.02-0.04, Moderate: 0.05-0.07, Aggressive:
              0.08-0.12
            </p>
          </div>

          <div>
            <Label className='mb-2 flex items-center gap-2 text-sm font-medium'>
              <DollarSign className='h-4 w-4' />
              Monthly Salary Override
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className='text-muted-foreground h-3 w-3 cursor-help' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Override current salary for calculations</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className='relative'>
              <Controller
                name='salaryOverride'
                control={control}
                rules={{
                  min: { value: 0, message: 'Salary must be positive' },
                  required: 'Salary is required',
                }}
                render={({ field: { onChange, value, name, ref } }) => (
                  <CurrencyInput
                    ref={ref}
                    name={name}
                    value={value ?? ''}
                    onValueChange={newValue => {
                      onChange(newValue); // This updates react-hook-form
                    }}
                    placeholder='50000'
                    disabled={loading || initializing}
                    min={0}
                  />
                )}
              />
            </div>
            {errors.salaryOverride && (
              <p className='text-destructive mt-1 text-sm'>
                {errors.salaryOverride.message}
              </p>
            )}
          </div>

          <Button type='submit' disabled={loading} className='w-full'>
            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? (
                <>
                  <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current'></div>
                  Calculating Projections...
                </>
              ) : (
                <>
                  <Calculator className='mr-2 h-4 w-4' />
                  Calculate Projection
                </>
              )}
            </Button>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
