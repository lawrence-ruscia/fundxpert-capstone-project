import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { applyWithdrawal } from '../services/withdrawalService';
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
import {
  Calculator,
  FileText,
  AlertCircle,
  User,
  Shield,
  Wallet,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BalanceCard } from '@/features/dashboard/employee/components/BalanceCard';
import { formatCurrency } from '@/features/dashboard/employee/utils/formatters';
import type {
  WithdrawalApplicationRequest,
  WithdrawalEligibility,
  WithdrawalType,
} from '../types/withdrawal';

const withdrawalSchema = (eligibility: WithdrawalEligibility) =>
  z
    .object({
      // Withdrawal type - limited to eligible types
      request_type: z.enum(
        eligibility.eligibleTypes as [WithdrawalType, ...WithdrawalType[]],
        {
          error: 'Please select a valid withdrawal type',
        }
      ),

      // Purpose detail - optional explanation
      purpose_detail: z
        .string()
        .max(1000, 'Purpose detail cannot exceed 1000 characters')
        .optional(),

      // Payout method preference
      payout_method: z
        .string()
        .min(1, 'Payout method is required')
        .max(30, 'Payout method cannot exceed 30 characters'),

      // Beneficiary information (required for Death withdrawals)
      beneficiary_name: z
        .string()
        .min(2, 'Beneficiary name must be at least 2 characters')
        .optional(),

      beneficiary_relationship: z
        .string()
        .min(2, 'Relationship must be at least 2 characters')
        .max(50, 'Relationship cannot exceed 50 characters')
        .optional(),

      beneficiary_contact: z
        .string()
        .min(2, 'Contact information is required')
        .optional(),

      // Notes field for additional information
      notes: z
        .string()
        .max(1000, 'Notes cannot exceed 1000 characters')
        .optional(),

      consent_acknowledged: z.boolean().refine(val => val === true, {
        message: 'Consent for processing is required',
      }),
    })
    .refine(
      data => {
        // For Death withdrawals, beneficiary info is mandatory
        if (data.request_type === 'Death') {
          return !!(
            data.beneficiary_name?.trim() &&
            data.beneficiary_relationship?.trim() &&
            data.beneficiary_contact?.trim()
          );
        }
        return true;
      },
      {
        message: 'Beneficiary information is required for Death withdrawals',
        path: ['beneficiary_name'],
      }
    )
    .refine(
      data => {
        // Purpose detail is recommended for certain withdrawal types
        const typesNeedingDetail = ['Disability', 'Other'];
        if (typesNeedingDetail.includes(data.request_type)) {
          return !!data.purpose_detail?.trim();
        }
        return true;
      },
      {
        message: 'Purpose detail is required for this withdrawal type',
        path: ['purpose_detail'],
      }
    );

export type WithdrawalFormData = z.infer<ReturnType<typeof withdrawalSchema>>;

// Helper function to get form defaults
const getWithdrawalFormDefaults = (
  eligibility: WithdrawalEligibility
): Partial<WithdrawalFormData> => {
  const defaults: Partial<WithdrawalFormData> = {
    payout_method: 'BankTransfer',
    consent_acknowledged: false,
  };

  // Set default withdrawal type to the first eligible type
  if (eligibility.eligibleTypes.length > 0) {
    defaults.request_type = eligibility.eligibleTypes[0];
  }

  return defaults;
};

export const WithdrawalApplicationForm = ({
  onSuccess,
  onCancel,
  eligibility,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  eligibility: WithdrawalEligibility;
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema(eligibility)),
    defaultValues: getWithdrawalFormDefaults(eligibility),
  });

  const onSubmit = async (data: WithdrawalFormData) => {
    try {
      const payload: WithdrawalApplicationRequest = {
        request_type: data.request_type,
        consent_acknowledged: data.consent_acknowledged,
        purpose_detail: data.purpose_detail,
        payout_method: data.payout_method,
        beneficiary_name: data.beneficiary_name,
        beneficiary_relationship: data.beneficiary_relationship,
        beneficiary_contact: data.beneficiary_contact,
      };
      await applyWithdrawal(payload);
      onSuccess();
    } catch (error) {
      console.error('Withdrawal application failed:', error);
      // TODO: Show an error toast here
    }
  };

  const watchedType = watch('request_type');

  return (
    <div className='mx-auto space-y-6 p-6'>
      {/* Balance Overview Card */}
      <BalanceCard
        label='Available for Withdrawal'
        value={formatCurrency(Number(eligibility.snapshot.vested_amount))}
        icon={Wallet}
        comparison={`Total Balance: ${formatCurrency(Number(eligibility.snapshot.total_balance))}`}
      />

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Left Column - Withdrawal Details */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <FileText className='text-primary h-5 w-5' />
                <CardTitle>Withdrawal Details</CardTitle>
              </div>
              <CardDescription>
                Select your withdrawal type and payout preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Withdrawal Type */}
              <div className='space-y-3'>
                <Label htmlFor='request_type'>Withdrawal Type</Label>
                <Select
                  onValueChange={value =>
                    setValue('request_type', value as WithdrawalType, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger
                    className={`${errors.request_type ? 'border-destructive' : ''} w-full`}
                  >
                    <SelectValue placeholder='Select withdrawal type...' />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibility.eligibleTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.request_type && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.request_type.message}
                  </p>
                )}
              </div>

              {/* Purpose Detail */}
              {(watchedType === 'Disability' || watchedType === 'Other') && (
                <div className='space-y-3'>
                  <Label htmlFor='purpose_detail'>Please specify</Label>
                  <Textarea
                    id='purpose_detail'
                    placeholder='Provide additional details about your withdrawal...'
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

              {/* Payout Method */}
              <div className='space-y-3'>
                <Label htmlFor='payout_method'>Payout Method</Label>
                <Select
                  onValueChange={value => setValue('payout_method', value)}
                  defaultValue='BankTransfer'
                >
                  <SelectTrigger
                    className={`${errors.payout_method ? 'border-destructive' : ''} w-full`}
                  >
                    <SelectValue placeholder='Select payout method' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='BankTransfer'>Bank Transfer</SelectItem>
                    <SelectItem value='Check'>Check</SelectItem>
                    <SelectItem value='Cash'>Cash</SelectItem>
                  </SelectContent>
                </Select>
                {errors.payout_method && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.payout_method.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Additional Information */}
          <Card>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <User className='text-primary h-5 w-5' />
                <CardTitle>Additional Information</CardTitle>
              </div>
              <CardDescription>
                Beneficiary details and additional notes
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Beneficiary Information - Required for Death */}
              {watchedType === 'Death' && (
                <>
                  <div className='space-y-3'>
                    <Label htmlFor='beneficiary_name'>Beneficiary Name</Label>
                    <Input
                      id='beneficiary_name'
                      type='text'
                      placeholder='Full name of beneficiary'
                      className={
                        errors.beneficiary_name ? 'border-destructive' : ''
                      }
                      {...register('beneficiary_name')}
                    />
                    {errors.beneficiary_name && (
                      <p className='text-destructive flex items-center gap-1 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.beneficiary_name.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <Label htmlFor='beneficiary_relationship'>
                      Relationship
                    </Label>
                    <Input
                      id='beneficiary_relationship'
                      type='text'
                      placeholder='e.g., Spouse, Child, Parent'
                      className={
                        errors.beneficiary_relationship
                          ? 'border-destructive'
                          : ''
                      }
                      {...register('beneficiary_relationship')}
                    />
                    {errors.beneficiary_relationship && (
                      <p className='text-destructive flex items-center gap-1 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.beneficiary_relationship.message}
                      </p>
                    )}
                  </div>

                  <div className='space-y-3'>
                    <Label htmlFor='beneficiary_contact'>
                      Contact Information
                    </Label>
                    <Input
                      id='beneficiary_contact'
                      type='text'
                      placeholder='Phone number or email'
                      className={
                        errors.beneficiary_contact ? 'border-destructive' : ''
                      }
                      {...register('beneficiary_contact')}
                    />
                    {errors.beneficiary_contact && (
                      <p className='text-destructive flex items-center gap-1 text-sm'>
                        <AlertCircle className='h-4 w-4' />
                        {errors.beneficiary_contact.message}
                      </p>
                    )}
                  </div>

                  <Separator />
                </>
              )}

              {/* Amount Information */}
              <div className='space-y-3'>
                <Label>Withdrawal Amount</Label>
                <Alert>
                  <Calculator className='h-4 w-4' />
                  <AlertDescription>
                    <strong>
                      Withdrawal Amount: ₱
                      {eligibility.snapshot.vested_amount.toLocaleString()}
                    </strong>
                    <br />
                    <span className='text-muted-foreground text-xs'>
                      This is your full vested balance. Unvested amounts (₱
                      {eligibility.snapshot.unvested_amount.toLocaleString()})
                      will be forfeited.
                    </span>
                  </AlertDescription>
                </Alert>
              </div>

              {/* Notes */}
              <div className='space-y-3'>
                <Label htmlFor='notes'>Additional Notes (Optional)</Label>
                <Textarea
                  id='notes'
                  placeholder='Any additional information or special requests...'
                  className={errors.notes ? 'border-destructive' : ''}
                  {...register('notes')}
                />
                {errors.notes && (
                  <p className='text-destructive flex items-center gap-1 text-sm'>
                    <AlertCircle className='h-4 w-4' />
                    {errors.notes.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Terms and Conditions */}
        <Card className='border-primary/20'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Shield className='text-primary h-5 w-5' />
              <CardTitle>Acknowledgment and Consent</CardTitle>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-start space-x-3'>
              <Checkbox
                id='consent_acknowledged'
                className='mt-1'
                checked={watch('consent_acknowledged')}
                onCheckedChange={checked => {
                  setValue('consent_acknowledged', checked === true, {
                    shouldValidate: true,
                  });
                }}
              />
              <div className='space-y-1'>
                <Label
                  htmlFor='consent_acknowledged'
                  className='cursor-pointer text-sm leading-relaxed font-normal'
                >
                  I consent to the processing of this withdrawal request and
                  acknowledge that:
                </Label>
                <ul className='text-muted-foreground ml-4 list-disc space-y-1 text-xs'>
                  <li>
                    This is a <strong>one-time withdrawal</strong> of my total
                    vested fund balance, after which I will no longer be an
                    active participant in the Provident Fund.
                  </li>
                  <li>
                    Any <strong>unvested employer contributions</strong> will be
                    forfeited if my tenure is less than 2 years (except in cases
                    of redundancy, retirement, total and permanent disability,
                    or death, which grant full vesting).
                  </li>
                  <li>
                    My personal and financial information will be reviewed, and
                    HR/Finance will process this request in accordance with
                    company policy.
                  </li>
                  <li>
                    Additional documentation (e.g., resignation letter,
                    redundancy notice, medical certificate, or death certificate
                    for beneficiaries) may be required.
                  </li>
                  <li>
                    I may be contacted for clarification or verification before
                    approval and payout.
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
                Submitting Request...
              </>
            ) : (
              'Submit Withdrawal Request'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
