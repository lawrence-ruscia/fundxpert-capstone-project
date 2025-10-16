import { useState } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchEmployees } from '../hooks/useSearchEmployees';
import { useRecordContribution } from '../hooks/useRecordContribution';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertCircle,
  User,
  DollarSign,
  Calendar,
  Search,
  Check,
  ChevronsUpDown,
  Building,
  Briefcase,
  Hash,
  Save,
  X,
  ArrowLeft,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/currency-input';
import { useNavigate } from 'react-router-dom';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

export type SearchEmployeesRecord = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: string;
};

// Zod schema for form validation
const recordContributionSchema = z.object({
  employee_search: z.string().min(1, 'Please select an employee'),
  selected_employee_id: z.number().min(1, 'Please select an employee'),
  employee_amount: z.union([z.string(), z.number()]).refine(val => {
    if (val === '' || val === null || val === undefined) return false;
    const numVal =
      typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
    return !isNaN(numVal) && numVal >= 0;
  }, 'Please enter a valid employee contribution amount'),
  employer_amount: z.union([z.string(), z.number()]).refine(val => {
    if (val === '' || val === null || val === undefined) return false;
    const numVal =
      typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
    return !isNaN(numVal) && numVal >= 0;
  }, 'Please enter a valid employer contribution amount'),
  contribution_date: z
    .string()
    .min(1, 'Contribution date is required')
    .refine(date => !isNaN(Date.parse(date)), 'Please select a valid date'),
});

// Output schema for API submission
const recordContributionOutputSchema = recordContributionSchema.transform(
  data => ({
    user_id: data.selected_employee_id,
    employee_amount:
      typeof data.employee_amount === 'string'
        ? parseFloat(data.employee_amount.replace(/[^\d.-]/g, ''))
        : data.employee_amount,
    employer_amount:
      typeof data.employer_amount === 'string'
        ? parseFloat(data.employer_amount.replace(/[^\d.-]/g, ''))
        : data.employer_amount,
    contribution_date: data.contribution_date,
  })
);

type RecordContributionFormData = z.infer<typeof recordContributionSchema>;
type RecordContributionOutputData = z.infer<
  typeof recordContributionOutputSchema
>;

export default function RecordContributionForm() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] =
    useState<SearchEmployeesRecord | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const navigate = useNavigate();

  const { results, clearResults } = useSearchEmployees(
    searchQuery,
    setSearchError
  );
  const { recordContribution } = useRecordContribution(
    setSearchError,
    () => {}
  );

  const form = useForm<RecordContributionFormData>({
    resolver: zodResolver(recordContributionSchema),
    defaultValues: {
      employee_search: '',
      selected_employee_id: 0,
      employee_amount: '',
      employer_amount: '',
      contribution_date: new Date().toISOString().split('T')[0],
    },
  });

  const handleEmployeeSelect = (employee: SearchEmployeesRecord) => {
    setSelectedEmployee(employee);
    const displayText = `${employee.name} (${employee.employee_id})`;
    form.setValue('employee_search', displayText);
    form.setValue('selected_employee_id', employee.id);
    setSearchOpen(false);
    clearResults();
    setSearchQuery('');

    // Clear any previous employee selection errors
    form.clearErrors('employee_search');
    form.clearErrors('selected_employee_id');
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    form.setValue('employee_search', value);

    // Reset selected employee if user starts typing again
    if (
      selectedEmployee &&
      value !== `${selectedEmployee.name} (${selectedEmployee.employee_id})`
    ) {
      setSelectedEmployee(null);
      form.setValue('selected_employee_id', 0);
    }
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearchQuery('');
    form.setValue('employee_search', '');
    form.setValue('selected_employee_id', 0);
    clearResults();
  };

  const onSubmit = async (data: RecordContributionFormData) => {
    // More robust validation
    if (
      !selectedEmployee ||
      !data.selected_employee_id ||
      data.selected_employee_id < 1
    ) {
      toast.error('Please select a valid employee');
      form.setError('selected_employee_id', {
        message: 'Please select an employee',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const transformedData: RecordContributionOutputData =
        recordContributionOutputSchema.parse(data);

      // Additional safety check
      if (!transformedData.user_id || transformedData.user_id < 1) {
        throw new Error('Invalid employee selection');
      }

      const recorded = await recordContribution(transformedData);

      if (recorded) {
        // Reset form on success
        form.reset({
          employee_search: '',
          selected_employee_id: 0,
          employee_amount: '',
          employer_amount: '',
          contribution_date: new Date().toISOString().split('T')[0],
        });
        setSelectedEmployee(null);
        setSearchQuery('');
        clearResults();

        toast.success('Contribution recorded successfully!');
        navigate('/hr/contributions', { replace: true });
      }
    } catch (error) {
      console.error('Failed to record contribution:', error);
      toast.error(getErrorMessage(error, 'Failed to record contribution'));
    } finally {
      setIsSubmitting(false);
    }
  };

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
          Record Contribution
        </h1>
        <p className='text-muted-foreground mt-2'>
          Record employee and employer contributions for processing
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Employee Selection Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <User className='text-primary h-5 w-5' />
                    </div>
                    Employee Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='employee_search'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-base font-medium'>
                          Search Employee{' '}
                          <span className='text-muted-foreground'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Popover
                              open={searchOpen}
                              onOpenChange={setSearchOpen}
                            >
                              <PopoverTrigger asChild>
                                <div className='relative'>
                                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                                  <Input
                                    placeholder='Type name or Employee ID...'
                                    className='h-12 pr-20 pl-10 text-base'
                                    value={field.value}
                                    onChange={e => {
                                      field.onChange(e.target.value);
                                      handleSearchChange(e.target.value);
                                      setSearchOpen(true);
                                    }}
                                  />
                                  <div className='absolute top-1/2 right-2 flex -translate-y-1/2 gap-1'>
                                    {selectedEmployee && (
                                      <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        className='h-8 w-8 p-0'
                                        onClick={handleClearEmployee}
                                        title='Clear selection'
                                      >
                                        <X className='h-3 w-3' />
                                      </Button>
                                    )}
                                    <Button
                                      type='button'
                                      variant='ghost'
                                      size='sm'
                                      className='h-8 w-8 p-0'
                                      onClick={() => setSearchOpen(!searchOpen)}
                                    >
                                      <ChevronsUpDown className='h-3 w-3' />
                                    </Button>
                                  </div>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent
                                className='w-[var(--radix-popover-trigger-width)] p-0'
                                align='start'
                              >
                                <Command>
                                  <CommandInput
                                    placeholder='Search employees...'
                                    value={searchQuery}
                                    onValueChange={handleSearchChange}
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      {searchQuery.length < 2
                                        ? 'Type at least 2 characters to search...'
                                        : 'No employees found.'}
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {results.map(employee => (
                                        <CommandItem
                                          key={employee.id}
                                          value={`${employee.name} ${employee.employee_id}`}
                                          onSelect={() =>
                                            handleEmployeeSelect(employee)
                                          }
                                          className='flex items-center gap-3 p-3'
                                        >
                                          <Check
                                            className={`h-4 w-4 ${
                                              selectedEmployee?.id ===
                                              employee.id
                                                ? 'opacity-100'
                                                : 'opacity-0'
                                            }`}
                                          />
                                          <div className='flex-1'>
                                            <div className='flex items-center gap-2'>
                                              <User className='text-muted-foreground h-4 w-4' />
                                              <span className='font-medium'>
                                                {employee.name}
                                              </span>
                                              <span className='text-muted-foreground'>
                                                ({employee.employee_id})
                                              </span>
                                            </div>
                                            <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                                              <div className='flex items-center gap-1'>
                                                <Building className='h-3 w-3' />
                                                {employee.department}
                                              </div>
                                              <div className='flex items-center gap-1'>
                                                <Briefcase className='h-3 w-3' />
                                                {employee.position}
                                              </div>
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Selected Employee Display */}
                  {selectedEmployee && (
                    <div className='bg-muted/50 rounded-lg border p-4'>
                      <div className='flex items-center gap-3'>
                        <div className='bg-primary/10 rounded-lg p-2'>
                          <User className='text-primary h-5 w-5' />
                        </div>
                        <div>
                          <h3 className='text-base font-medium'>
                            {selectedEmployee.name}
                          </h3>
                          <div className='text-muted-foreground mt-1 flex items-center gap-4 text-sm'>
                            <div className='flex items-center gap-1'>
                              <Hash className='h-3 w-3' />
                              {selectedEmployee.employee_id}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Building className='h-3 w-3' />
                              {selectedEmployee.department}
                            </div>
                            <div className='flex items-center gap-1'>
                              <Briefcase className='h-3 w-3' />
                              {selectedEmployee.position}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contribution Details Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <DollarSign className='text-primary h-5 w-5' />
                    </div>
                    Contribution Details
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormItem className='relative py-2'>
                      <FormLabel className='text-base font-medium'>
                        Employee Contribution{' '}
                        <span className='text-muted-foreground'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          name='employee_amount'
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
                              placeholder='Enter employee contribution'
                              min={0}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    <FormItem className='relative py-2'>
                      <FormLabel className='text-base font-medium'>
                        Employer Contribution{' '}
                        <span className='text-muted-foreground'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          name='employer_amount'
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
                              placeholder='Enter employer contribution'
                              min={0}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>

                  <FormField
                    control={form.control}
                    name='contribution_date'
                    render={({ field }) => (
                      <FormItem className='md:max-w-xs'>
                        <FormLabel className='text-base font-medium'>
                          Contribution Date{' '}
                          <span className='text-muted-foreground'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Calendar className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              type='date'
                              className='h-12 pl-10 text-base'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className='flex flex-col gap-4 sm:flex-row sm:justify-end'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    form.reset({
                      employee_search: '',
                      selected_employee_id: 0,
                      employee_amount: '',
                      employer_amount: '',
                      contribution_date: new Date().toISOString().split('T')[0],
                    });
                    setSelectedEmployee(null);
                    setSearchQuery('');
                    clearResults();
                  }}
                  className='h-12 px-8 text-base sm:w-auto'
                  disabled={isSubmitting}
                >
                  Reset Form
                </Button>
                <Button
                  type='submit'
                  disabled={isSubmitting || !selectedEmployee}
                  className='h-12 px-8 text-base sm:w-auto'
                >
                  {isSubmitting ? (
                    <>
                      <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                      Recording Contribution...
                    </>
                  ) : (
                    <>
                      <Save className='mr-2 h-4 w-4' />
                      Save Contribution
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        {/* Side Panel */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-6'>
            <CardHeader>
              <CardTitle className='text-lg'>Form Guidelines</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='flex items-start gap-3 text-sm'>
                  <Search className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Employee Search</p>
                    <p className='text-muted-foreground text-xs'>
                      Type employee name or ID to search and select
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <DollarSign className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Contribution Amounts</p>
                    <p className='text-muted-foreground text-xs'>
                      Enter both employee and employer contribution amounts
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <Calendar className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Contribution Date</p>
                    <p className='text-muted-foreground text-xs'>
                      Select the date when the contribution was made
                    </p>
                  </div>
                </div>
              </div>

              <div className='border-t pt-4'>
                <p className='text-muted-foreground text-xs'>
                  All fields are required. Make sure to select the correct
                  employee before recording the contribution amounts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error Display */}
      {searchError && (
        <div className='fixed right-4 bottom-4 max-w-md'>
          <div className='bg-destructive text-destructive-foreground flex items-center gap-2 rounded-lg p-3'>
            <AlertCircle className='h-4 w-4' />
            <span className='text-sm'>{searchError}</span>
            <Button
              variant='ghost'
              size='sm'
              className='text-destructive-foreground hover:bg-destructive-foreground/20 ml-auto h-6 w-6 p-0'
              onClick={() => setSearchError(null)}
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
