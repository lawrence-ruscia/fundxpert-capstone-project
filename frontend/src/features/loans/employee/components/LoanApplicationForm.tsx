import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { applyForLoan } from '../services/loanService';

const loanSchema = (maxLoan: number) =>
  z
    .object({
      amount: z
        .number({
          error: 'Amount must be a valid number',
        })
        .min(1000, 'Minimum ₱1,000')
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
      consent_acknowledged: z.literal(true, {
        error: 'Consent must be acknowledged',
      }),

      // Optional co-maker
      co_maker_employee_id: z
        .string()
        .regex(/^\d{2}-\d{5}$/, 'Invalid employee ID format (e.g., 12-34567)')
        .optional(),
    })
    .refine(
      data =>
        data.purpose_category !== 'Others' || !!data.purpose_detail?.trim(),
      {
        message: "Purpose detail is required when 'Others' is selected",
        path: ['purpose_detail'],
      }
    );

type LoanFormData = z.infer<ReturnType<typeof loanSchema>>;
// Form Field Component
function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '15px' }}>
      <label
        style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ color: 'red', fontSize: '14px', margin: '5px 0 0 0' }}>
          {error}
        </p>
      )}
    </div>
  );
}

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
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema(maxLoan)),
    defaultValues: {
      repayment_term_months: 12,
    },
  });

  const onSubmit = async (data: LoanFormData) => {
    try {
      const payload = {
        amount: data.amount,
        repayment_term_months: data.repayment_term_months,
        purpose_category:
          data.purpose_category === 'Others'
            ? `Others: ${data.purpose_detail ?? ''}`
            : data.purpose_category,
        purpose_detail: data.purpose_detail,
        consent_acknowledged: data.consent_acknowledged,
        co_maker_employee_id: data.co_maker_employee_id ?? null,
      };
      await applyForLoan(payload);
      onSuccess();
    } catch (error) {
      console.error('Loan application failed:', error);
      // TODO: Show an error toast here
    }
  };

  const watchedPurpose = watch('purpose_category');

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
  };

  const buttonStyle = {
    padding: '10px 20px',
    margin: '10px 5px 0 0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  };

  return (
    <div
      style={{
        maxWidth: '500px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
    >
      <h2>Apply for Loan</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Maximum eligible amount: ₱{maxLoan.toLocaleString()}
      </p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label='Loan Amount (₱)' error={errors.amount?.message}>
          <input
            type='number'
            style={inputStyle}
            placeholder='Enter amount'
            {...register('amount', { valueAsNumber: true })}
          />
        </FormField>

        <FormField
          label='Loan Purpose'
          error={errors.purpose_category?.message}
        >
          <select {...register('purpose_category')}>
            <option value=''>Select purpose...</option>
            <option value='Medical'>Medical/Healthcare</option>
            <option value='Education'>Education/Training</option>
            <option value='Housing'>Housing/Rent</option>
            <option value='Emergency'>Emergency</option>
            <option value='Debt'>Debt</option>
            <option value='Others'>Others</option>
          </select>
        </FormField>

        {(watchedPurpose === 'Emergency' || watchedPurpose === 'Others') && (
          <FormField
            label='Please specify'
            error={errors.purpose_detail?.message}
          >
            <textarea {...register('purpose_detail')} />
          </FormField>
        )}

        <FormField
          label='Co-Maker Employee Id (Optional)'
          error={errors.co_maker_employee_id?.message}
        >
          <input
            type='text'
            style={inputStyle}
            placeholder='EM-002'
            {...register('co_maker_employee_id', {
              setValueAs: value =>
                value?.trim() === '' ? undefined : value?.trim(),
            })}
          />
        </FormField>

        <FormField
          label='Repayment Term (months)'
          error={errors.repayment_term_months?.message}
        >
          <select
            style={inputStyle}
            {...register('repayment_term_months', { valueAsNumber: true })}
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month}>
                {month} month{month > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label='' error={errors.consent_acknowledged?.message}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: 'normal',
            }}
          >
            <input
              type='checkbox'
              style={{ marginRight: '8px' }}
              {...register('consent_acknowledged')}
            />
            I consent to the loan terms and conditions
          </label>
        </FormField>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type='button'
            onClick={onCancel}
            style={{
              ...buttonStyle,
              backgroundColor: '#6c757d',
              color: 'white',
            }}
          >
            Cancel
          </button>
          <button
            type='submit'
            disabled={isSubmitting}
            style={{
              ...buttonStyle,
              backgroundColor: isSubmitting ? '#ccc' : '#007bff',
              color: 'white',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};
