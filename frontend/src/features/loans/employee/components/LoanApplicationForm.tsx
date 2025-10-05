import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { applyForLoan } from '../services/loanService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Calculator, FileText, AlertCircle, User, Shield } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { LoanPurposeCategory } from '../types/loan';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import { CurrencyInput } from '@/shared/components/currency-input';
import { toast } from 'sonner';

const loanSchema = (maxLoan: number) =>
  z
    .object({
      amount: z
        .number({
          error: 'Amount must be a valid number',
        })
        .min(5000, 'Minimum ₱5,000')
        .max(maxLoan, `Cannot exceed ₱${maxLoan} (50% of vested balance)`),

      repayment_term_months: z
        .number({
          error: 'Repayment term must be a number',
        })
        .min(1, 'Minimum 1 month')
        .max(24, 'Maximum 24 months'),

      // Hybrid purpose
      purpose_category: z.enum(
        ['Medical', 'Education', 'Housing', 'Emergency', 'Debt', 'Others'],
        {
          error: 'Purpose category is required',
        }
      ),
      purpose_detail: z.string().optional(),

      // Consent must be acknowledged
      consent_acknowledged: z.boolean().refine(val => val === true, {
        message: 'Consent must be acknowledged',
      }),

      // Optional co-maker
      co_maker_employee_id: z
        .string()
        .regex(/^\d{2}-\d{5}$/, 'Invalid employee ID format (e.g., 12-34567)')
        .optional(),
    })
    .refine(
      data => {
        // If purpose_category is 'Others' or 'Emergency', purpose_detail is required
        if (
          data.purpose_category === 'Others' ||
          data.purpose_category === 'Emergency'
        ) {
          return !!data.purpose_detail?.trim();
        }
        // For all other categories, purpose_detail is not required
        return true;
      },
      {
        message:
          "Purpose detail is required when 'Others' or 'Emergency' is selected",
        path: ['purpose_detail'],
      }
    );

type LoanFormData = z.infer<ReturnType<typeof loanSchema>>;

// Loan Application Form Component
export const LoanApplicationForm = ({
  onSuccess,
  onCancel,
  maxLoan,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  maxLoan: number;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    control,
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema(maxLoan)),
    defaultValues: {
      repayment_term_months: 12,
      consent_acknowledged: false,
    },
  });

  const onSubmit = async (data: LoanFormData) => {
    try {
      const payload = {
        amount: data.amount,
        repayment_term_months: data.repayment_term_months,
        purpose_category: data.purpose_category,
        purpose_detail: data.purpose_detail,
        consent_acknowledged: data.consent_acknowledged,
        co_maker_employee_id: data.co_maker_employee_id ?? null,
      };
      await applyForLoan(payload);
      // Success toast
      toast.success('Loan Application Submitted Successfully!', {
        description: `Your loan request for ${formatCurrency(data.amount)} has been submitted and is now under review.`,
        duration: 5000,
      });

      onSuccess();
    } catch (error) {
      console.error('Loan application failed:', error);
      toast.error('Loan Application Failed', {
        description:
          error instanceof Error
            ? error.message
            : 'Unable to submit your loan application. Please check your details and try again.',
        duration: 6000,
        action: {
          label: 'Retry',
          onClick: () => onSubmit(data),
        },
      });
    }
  };

  const watchedPurpose = watch('purpose_category');
  const watchedAmount = watch('amount');
  const consentValue = watch('consent_acknowledged');

  // Calculate estimated monthly payment
  const calculateMonthlyPayment = (amount: number, months: number) => {
    if (!amount || !months) return 0;
    // Simple calculation - in real app would include interest
    return Math.round(amount / months);
  };

  const monthlyPayment = calculateMonthlyPayment(
    watchedAmount || 0,
    watch('repayment_term_months') || 12
  );

  return (
    <div className='mx-auto space-y-6 p-6'>
      {/* Eligibility Card */}
      <BalanceCard
        label='Loan Eligibility'
        value={formatCurrency(Number(maxLoan))}
        icon={Calculator}
        description='Based on 50% of your vested balance'
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Left Column - Loan Details */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <FileText className='text-primary h-5 w-5' />
                <CardTitle>Loan Details</CardTitle>
              </div>
              <CardDescription>
                Enter your loan amount and repayment preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Loan Amount */}

              <div className='relative space-y-3'>
                <Label htmlFor='amount'>Loan Amount (₱)</Label>
                <Controller
                  name='amount'
                  control={control}
                  rules={{
                    min: { value: 1000, message: 'Minimum ₱1,000' },
                    required: 'Salary is required',
                    max: {
                      value: maxLoan,
                      message: `Cannot exceed ₱${maxLoan} (50% of vested balance)`,
                    },
                  }}
                  render={({ field: { onChange, value, name, ref } }) => (
                    <CurrencyInput
                      ref={ref}
                      name={name}
                      value={value ?? ''}
                      onValueChange={newValue => {
                        onChange(newValue); // This updates react-hook-form
                      }}
                      className={errors.amount ? 'border-destructive' : ''}
                      placeholder='Enter amount'
                      min={0}
                    />
                  )}
                />

                {errors.amount && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Repayment Term */}
              <div className='space-y-3'>
                <Label htmlFor='repayment_term'>Repayment Term</Label>
                <Select
                  onValueChange={value =>
                    setValue('repayment_term_months', Number.parseInt(value))
                  }
                  defaultValue='12'
                >
                  <SelectTrigger
                    className={`${errors.repayment_term_months ? 'border-destructive' : ''} w-full`}
                  >
                    <SelectValue placeholder='Select repayment term' />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {month} month{month > 1 ? 's' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.repayment_term_months && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.repayment_term_months.message}
                  </p>
                )}
              </div>

              {/* Monthly Payment Estimate */}
              {monthlyPayment > 0 && (
                <Alert>
                  <Calculator className='h-4 w-4' />
                  <AlertDescription>
                    <strong>
                      Estimated monthly payment: ₱
                      {monthlyPayment.toLocaleString()}
                    </strong>
                    <br />
                    <span className='text-muted-foreground text-xs'>
                      This is an estimate. Actual amount may vary based on
                      interest rates.
                    </span>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Right Column - Purpose & Co-maker */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <User className='text-primary h-5 w-5' />
                <CardTitle>Loan Purpose & Co-maker</CardTitle>
              </div>
              <CardDescription>
                Specify the purpose and optional co-maker details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Loan Purpose */}
              <div className='space-y-3'>
                <Label htmlFor='purpose_category'>Loan Purpose</Label>
                <Select
                  onValueChange={value =>
                    setValue('purpose_category', value as LoanPurposeCategory, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={`${errors.purpose_category ? 'border-destructive' : ''} w-full`}
                  >
                    <SelectValue placeholder='Select purpose...' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Medical'>Medical/Healthcare</SelectItem>
                    <SelectItem value='Education'>
                      Education/Training
                    </SelectItem>
                    <SelectItem value='Housing'>Housing/Rent</SelectItem>
                    <SelectItem value='Emergency'>Emergency</SelectItem>
                    <SelectItem value='Debt'>Debt Consolidation</SelectItem>
                    <SelectItem value='Others'>Others</SelectItem>
                  </SelectContent>
                </Select>
                {errors.purpose_category && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.purpose_category.message}
                  </p>
                )}
              </div>

              {/* Purpose Detail */}
              {(watchedPurpose === 'Emergency' ||
                watchedPurpose === 'Others') && (
                <div className='space-y-3'>
                  <Label htmlFor='purpose_detail'>Please specify</Label>
                  <Textarea
                    id='purpose_detail'
                    placeholder='Provide additional details about your loan purpose...'
                    className={
                      errors.purpose_detail ? 'border-destructive' : ''
                    }
                    {...register('purpose_detail')}
                  />
                  {errors.purpose_detail && (
                    <p className='text-destructive flex items-center gap-1 text-sm'>
                      <AlertCircle className='h-4 w-4' />
                      {errors.purpose_detail.message}
                    </p>
                  )}
                </div>
              )}

              <Separator />

              {/* Co-maker */}
              <div className='space-y-3'>
                <Label htmlFor='co_maker'>
                  Co-Maker Employee ID (Optional)
                </Label>
                <Input
                  id='co_maker'
                  type='text'
                  placeholder='e.g., 12-34567'
                  className={
                    errors.co_maker_employee_id ? 'border-destructive' : ''
                  }
                  {...register('co_maker_employee_id', {
                    setValueAs: value =>
                      value?.trim() === '' ? undefined : value?.trim(),
                  })}
                />
                {errors.co_maker_employee_id && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.co_maker_employee_id.message}
                  </p>
                )}
                <p className='text-muted-foreground text-xs'>
                  A co-maker can help strengthen your loan application
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terms and Conditions */}
        <Card className='border-primary/20'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Shield className='text-primary h-5 w-5' />
              <CardTitle>Terms and Conditions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='consent'
                className='mt-1'
                checked={consentValue}
                onCheckedChange={checked => {
                  setValue('consent_acknowledged', checked === true, {
                    shouldValidate: true,
                  });
                }}
              />
              <div className='space-y-1'>
                <Label
                  htmlFor='consent'
                  className='cursor-pointer text-sm leading-relaxed font-normal'
                >
                  I acknowledge and consent to the loan terms and conditions,
                  including:
                </Label>
                <ul className='text-muted-foreground ml-4 list-disc space-y-1 text-xs'>
                  <li>
                    The maximum loanable amount is{' '}
                    <strong>50% of my vested fund balance</strong>.
                  </li>
                  <li>
                    The repayment term shall not exceed{' '}
                    <strong>24 months</strong>.
                  </li>
                  <li>
                    <strong>Automatic deductions</strong> will be made from my
                    salary and/or benefits until the loan is fully settled.
                  </li>
                  <li>
                    Only <strong>one active loan</strong> may be maintained at a
                    time.
                  </li>
                  <li>
                    The loan request is subject to{' '}
                    <strong>review and approval</strong> by HR and Finance.
                  </li>
                  <li>
                    Failure to comply with repayment terms may result in{' '}
                    <strong>forfeiture of benefits</strong> or other actions as
                    per company policy.
                  </li>
                </ul>
              </div>
            </div>
            {errors.consent_acknowledged && (
              <p className='text-destructive mt-2 flex items-center gap-1 text-sm'>
                <AlertCircle className='h-4 w-4' />
                {errors.consent_acknowledged.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex flex-col justify-end gap-3 sm:flex-row'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            className='w-full bg-transparent sm:w-auto'
          >
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='w-full sm:w-auto'
          >
            {isSubmitting ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                Submitting Application...
              </>
            ) : (
              'Submit Application'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
