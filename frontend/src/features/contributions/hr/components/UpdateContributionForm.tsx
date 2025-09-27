import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';
import { hrContributionsService } from '../services/hrContributionService';
import {
  type Contribution,
  type EmployeeByContributionId,
} from '../types/hrContribution';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  User,
  FileText,
  Save,
  ArrowLeft,
  Building,
  Briefcase,
  Hash,
  Calendar,
  Edit,
  History,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/currency-input';

// Helper function to safely parse amount (handles string/number/empty safely)
const safeParseAmount = (val: string | number | undefined | null): number => {
  if (val === '' || val === null || val === undefined) {
    throw new Error('Amount cannot be empty');
  }

  let numVal: number;
  if (typeof val === 'string') {
    // Remove non-numeric chars except decimal and negative
    const cleaned = val.replace(/[^\d.-]/g, '');
    numVal = parseFloat(cleaned);
  } else if (typeof val === 'number') {
    numVal = val;
  } else {
    throw new Error('Invalid amount type');
  }

  if (isNaN(numVal) || numVal < 0) {
    throw new Error('Invalid amount value');
  }

  return numVal;
};

// Zod schema for form validation
const updateContributionSchema = z.object({
  employeeAmount: z
    .union([z.string(), z.number()])
    .refine(val => val !== '' && val !== null && val !== undefined, {
      message: 'Please enter a valid employee contribution amount',
    })
    .refine(
      val => {
        try {
          const numVal = safeParseAmount(val);
          return numVal >= 0;
        } catch {
          return false;
        }
      },
      {
        message: 'Please enter a valid employee contribution amount',
      }
    ),
  employerAmount: z
    .union([z.string(), z.number()])
    .refine(val => val !== '' && val !== null && val !== undefined, {
      message: 'Please enter a valid employer contribution amount',
    })
    .refine(val => {
      try {
        const numVal = safeParseAmount(val);
        return numVal >= 0;
      } catch {
        return false;
      }
    })
    .refine(
      val => {
        try {
          const numVal = safeParseAmount(val);
          return numVal >= 0;
        } catch {
          return false;
        }
      },
      {
        message: 'Please enter a valid employer contribution amount',
      }
    ),
  notes: z.string().optional(),
});

// Output schema for API submission
const updateContributionOutputSchema = updateContributionSchema.transform(
  data => ({
    employeeAmount: safeParseAmount(data.employeeAmount),
    employerAmount: safeParseAmount(data.employerAmount),
    notes: data.notes || '',
  })
);

type UpdateContributionFormData = z.infer<typeof updateContributionSchema>;
type UpdateContributionOutputData = z.infer<
  typeof updateContributionOutputSchema
>;

export default function UpdateContributionForm() {
  const { id: idParam } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [employee, setEmployee] = useState<EmployeeByContributionId | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<UpdateContributionFormData>({
    resolver: zodResolver(updateContributionSchema),
    defaultValues: {
      employeeAmount: '',
      employerAmount: '',
      notes: '',
    },
  });

  useEffect(() => {
    async function fetchContribution() {
      // Step 1: Strict ID validation (fixes NaN/invalid ID issues)
      if (!idParam) {
        const errMsg = 'No contribution ID provided in URL';
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      const id = Number(idParam);
      if (isNaN(id) || id < 1) {
        const errMsg = 'Invalid contribution ID in URL';
        setError(errMsg);
        toast.error(errMsg);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Step 2: Fetch sequentially for better error handling (contribution first)
        const contributionsRes =
          await hrContributionsService.getContributionsById(id);
        if (!contributionsRes) {
          const errMsg = 'Contribution not found';
          setError(errMsg);
          toast.error(errMsg);
          setLoading(false);
          return;
        }
        // Only fetch employee if contribution exists (dependency)
        const employeeRes =
          await hrContributionsService.getEmployeeByContributionId(id);
        if (!employeeRes) {
          // Don't hard-fail; allow update if employee data is optional (adjust based on needs)
          console.warn(
            'Employee data not found for contribution, but proceeding...'
          );
        }

        setContribution(contributionsRes);
        setEmployee(employeeRes);
        // Step 3: Populate form (now safe with validated data and camelCase from service)
        form.reset({
          employeeAmount: contributionsRes.employeeAmount?.toString() || '',
          employerAmount: contributionsRes.employerAmount?.toString() || '',
          notes: contributionsRes.notes || '',
        });
      } catch (err: unknown) {
        console.error('Failed to fetch contribution:', err); // Log full error for debugging
        const errMsg = err.message || 'Failed to load contribution data';
        setError(errMsg);
        toast.error(errMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchContribution();
  }, [idParam, navigate, form]);

  const onSubmit = async (data: UpdateContributionFormData) => {
    if (!contribution || !idParam) {
      toast.error('Invalid contribution data');
      return;
    }

    try {
      setIsSubmitting(true);

      const transformedData: UpdateContributionOutputData =
        updateContributionOutputSchema.parse(data);

      await hrContributionsService.updateContribution(
        Number(idParam),
        transformedData
      );

      toast.success(
        'Contribution updated successfully! A new audit record has been created.'
      );
      navigate('/hr/contributions');
    } catch (error) {
      console.error('Failed to update contribution:', error);
      toast.error('Failed to update contribution');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate total amounts for display
  const calculateTotal = (
    employeeAmount: string | number,
    employerAmount: string | number
  ) => {
    const employee =
      parseFloat(String(employeeAmount || '').replace(/[^\d.-]/g, '')) || 0;
    const employer =
      parseFloat(String(employerAmount || '').replace(/[^\d.-]/g, '')) || 0;
    return employee + employer;
  };

  const watchedEmployeeAmount = form.watch('employeeAmount');
  const watchedEmployerAmount = form.watch('employerAmount');
  const currentTotal = calculateTotal(
    watchedEmployeeAmount || '',
    watchedEmployerAmount || ''
  );
  const originalTotal =
    (contribution?.employeeAmount || 0) + (contribution?.employerAmount || 0);

  if (loading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4'>
              <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              <span className='text-muted-foreground text-sm'>
                Loading contribution data...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !contribution) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='text-destructive mx-auto mb-4 h-12 w-12' />
            <p className='text-destructive mb-6 text-sm font-medium'>
              {error || 'Contribution not found'}
            </p>
            <Button onClick={() => navigate('/hr/contributions')}>
              Back to Contributions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container px-4'>
      <div className='mb-8'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => navigate('/hr/contributions', { replace: true })}
          className='p-2'
        >
          <ArrowLeft className='h-4 w-4' />
        </Button>

        <h1 className='text-3xl font-bold tracking-tight'>
          Update Contribution
        </h1>
        <p className='text-muted-foreground mt-2'>
          Adjust contribution amounts and add audit notes. This will preserve
          the original record and create a new entry.
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Employee Information Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <User className='text-primary h-5 w-5' />
                    </div>
                    Employee Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='bg-muted/50 rounded-lg border p-4'>
                    <div className='flex items-center gap-3'>
                      <div className='bg-primary/10 rounded-lg p-2'>
                        <User className='text-primary h-5 w-5' />
                      </div>
                      <div>
                        <h3 className='text-base font-medium'>
                          {employee?.name || 'Unknown Employee'}
                        </h3>
                        <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                          <div className='flex items-center gap-1'>
                            <Hash className='h-3 w-3' />
                            {employee?.employee_id || 'N/A'}
                          </div>
                          <div className='flex items-center gap-1'>
                            <Building className='h-3 w-3' />
                            {employee?.department || 'N/A'}
                          </div>
                          <div className='flex items-center gap-1'>
                            <Briefcase className='h-3 w-3' />
                            {employee?.position || 'N/A'}
                          </div>
                          <div className='flex items-center gap-1'>
                            <Calendar className='h-3 w-3' />
                            {contribution.contributionDate
                              ? new Date(
                                  contribution.contributionDate
                                ).toLocaleDateString()
                              : 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Original vs Updated Amounts Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <Edit className='text-primary h-5 w-5' />
                    </div>
                    Contribution Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  {/* Original Amounts Display */}
                  <div className='bg-muted/30 rounded-lg border p-4'>
                    <h4 className='text-muted-foreground mb-3 flex items-center gap-2 text-sm font-medium'>
                      <History className='h-4 w-4' />
                      Original Amounts
                    </h4>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                      <div>
                        <p className='text-muted-foreground text-xs'>
                          Employee
                        </p>
                        <p className='font-medium'>
                          ₱
                          {contribution.employeeAmount?.toLocaleString() ||
                            '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs'>
                          Employer
                        </p>
                        <p className='font-medium'>
                          ₱
                          {contribution.employerAmount?.toLocaleString() ||
                            '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className='text-muted-foreground text-xs'>Total</p>
                        <p className='font-medium'>
                          ₱{originalTotal.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* New Amounts Input */}
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormItem className='relative py-2'>
                      <FormLabel className='text-base font-medium'>
                        New Employee Contribution{' '}
                        <span className='text-muted-foreground'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          name='employeeAmount'
                          control={form.control}
                          render={({
                            field: { onChange, value, name, ref },
                            fieldState: { error },
                          }) => (
                            <CurrencyInput
                              ref={ref}
                              name={name}
                              value={value ?? ''}
                              onValueChange={onChange}
                              className={`text-base ${error ? 'border-destructive' : ''}`}
                              placeholder='Enter new employee contribution'
                              min={0}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    <FormItem className='relative py-2'>
                      <FormLabel className='text-base font-medium'>
                        New Employer Contribution{' '}
                        <span className='text-muted-foreground'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          name='employerAmount'
                          control={form.control}
                          render={({
                            field: { onChange, value, name, ref },
                            fieldState: { error },
                          }) => (
                            <CurrencyInput
                              ref={ref}
                              name={name}
                              value={value ?? ''}
                              onValueChange={onChange}
                              className={`text-base ${error ? 'border-destructive' : ''}`}
                              placeholder='Enter new employer contribution'
                              min={0}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  {/* Updated Total Display */}
                  {(watchedEmployeeAmount || watchedEmployerAmount) && (
                    <div className='rounded-lg border border-blue-200 bg-blue-50 p-4'>
                      <h4 className='mb-2 text-sm font-medium text-blue-800'>
                        New Total
                      </h4>
                      <div className='text-2xl font-bold text-blue-900'>
                        ₱{currentTotal.toLocaleString()}
                      </div>
                      <p className='mt-1 text-xs text-blue-700'>
                        Difference: {currentTotal > originalTotal ? '+' : ''}₱
                        {(currentTotal - originalTotal).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <FileText className='text-primary h-5 w-5' />
                    </div>
                    Audit Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-base font-medium'>
                          Reason for Adjustment
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Enter the reason for this contribution adjustment (optional but recommended for audit trail)...'
                            className='min-h-[100px] resize-none text-base'
                            {...field}
                          />
                        </FormControl>
                        <p className='text-muted-foreground text-xs'>
                          This note will be saved with the adjustment for audit
                          purposes.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className='mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4'>
                    <div className='flex items-start gap-2'>
                      <AlertCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600' />
                      <div>
                        <p className='text-sm font-medium text-amber-800'>
                          Audit Trail Notice
                        </p>
                        <p className='mt-1 text-xs text-amber-700'>
                          This update will mark the original record as adjusted
                          and create a new entry preserving the complete audit
                          history.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-4 sm:flex-row sm:justify-end'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => navigate('/hr/contributions')}
                    className='h-12 px-8 text-base sm:w-auto'
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={isSubmitting}
                    className='h-12 px-8 text-base sm:w-auto'
                  >
                    {isSubmitting ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                        Updating Contribution...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Update Contribution
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>

        {/* Side Panel */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Update Guidelines</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-start gap-3 text-sm'>
                  <Edit className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Contribution Adjustment</p>
                    <p className='text-muted-foreground text-xs'>
                      Update employee and employer contribution amounts
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <History className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Audit Trail</p>
                    <p className='text-muted-foreground text-xs'>
                      Original record preserved, new entry created
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <FileText className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Notes</p>
                    <p className='text-muted-foreground text-xs'>
                      Document reason for adjustment (recommended)
                    </p>
                  </div>
                </div>
              </div>

              <div className='border-t pt-4'>
                <p className='text-muted-foreground text-xs'>
                  Contribution ID: <span className='font-mono'>#{idParam}</span>
                </p>
                <p className='text-muted-foreground mt-1 text-xs'>
                  All changes are tracked and auditable for compliance purposes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
