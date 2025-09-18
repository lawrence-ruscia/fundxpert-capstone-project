import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from '@radix-ui/react-tooltip';
import {
  Target,
  Calendar,
  TrendingUp,
  DollarSign,
  Info,
  Calculator,
  AlertCircle,
} from 'lucide-react';
import { Label } from 'recharts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

const projectionSchema = z.object({
  years: z.number().min(1).max(30),
  growthRate: z.number().min(0).max(0.2), // up to 20% for safety
  salaryOverride: z.number().optional(),
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
  } = useForm<ProjectionSchema>({
    resolver: zodResolver(projectionSchema),
    defaultValues: { years: 10, growthRate: 0.03 },
  });

  const watchedYears = watch('years');

  return (
    <Card className='from-card to-card/80 border-0 bg-gradient-to-br shadow-xl lg:sticky lg:top-8'>
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
              <Input
                type='number'
                step='0.001'
                min='0'
                max='0.2'
                {...register('growthRate', { valueAsNumber: true })}
                className='pr-8'
                placeholder='0.03'
                disabled={loading}
              />
              <div className='absolute inset-y-0 right-0 flex items-center pr-3'>
                <span className='text-muted-foreground text-sm'>%</span>
              </div>
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
              <div className='absolute inset-y-0 left-0 flex items-center pl-3'>
                <span className='text-muted-foreground text-sm'>₱</span>
              </div>
              <Input
                type='number'
                {...register('salaryOverride', { valueAsNumber: true })}
                className='pl-8'
                placeholder='50000'
                disabled={loading}
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
