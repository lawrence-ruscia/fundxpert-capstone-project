import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as hrService from '../services/hrService.js';
import { toast } from 'sonner';
import { useEmployeeForm } from '../hooks/useEmployeeForm.js';
import { useNavigate } from 'react-router-dom';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertCircle,
  User,
  Briefcase,
  Mail,
  Hash,
  Shield,
  Save,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  CalendarIcon,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/currency-input';

// Import the password generator (you'll need to add this to your utils)
import { generateTempPassword } from '@/utils/generateTempPassword.js';
import { EmployeeDeleteDialog } from './EmployeeDeleteDialog.js';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.js';
import { cn } from '@/lib/utils.js';
import { Calendar } from '@/components/ui/calendar.js';
import { format } from 'date-fns';
import { getErrorMessage } from '@/shared/api/getErrorMessage.js';

type EmployeeEditFormProps = {
  id: number;
};

// Input schema for form validation
const editEmployeeInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .refine(
      val => {
        const trimmed = val.trim();
        const parts = trimmed.split(/\s+/);
        return parts.length >= 2 && parts.every(part => part.length > 0);
      },
      {
        message: 'Please enter both first name and last name',
      }
    ),
  email: z.email(),
  // IMPORTANT: Temporarily remove company email constraint
  // email: z
  //   .email('Invalid email address')
  //   .refine(val => val.endsWith('@metrobank.com.ph'), {
  //     message: 'Email must use the @metrobank.com.ph domain',
  //   }),
  employee_id: z
    .string()
    .regex(/^\d{2}-\d{5}$/, 'Employee ID must follow the format NN-NNNNN'),
  department_id: z.string().min(1, 'Please select a department'),
  position_id: z.string().min(1, 'Please select a position'),
  salary: z.union([z.string(), z.number()]).refine(val => {
    if (val === '' || val === null || val === undefined) return false;
    const numVal =
      typeof val === 'string' ? parseFloat(val.replace(/[^\d.-]/g, '')) : val;
    return !isNaN(numVal) && numVal > 0;
  }, 'Please enter a valid salary amount'),
  employment_status: z.enum(['Active', 'Resigned', 'Retired', 'Terminated']),
  date_hired: z
    .string()
    .min(1, 'Date hired is required')
    .refine(date => !isNaN(Date.parse(date)), 'Please select a valid date'),
  generateTempPassword: z.string().optional(), // Optional temporary password field
});

// Helper function to format date properly (fixes the -1 day issue)
const formatDateForInput = (dateString: string | Date): string => {
  if (!dateString) return '';

  // If it's already a string in YYYY-MM-DD format, return it
  if (
    typeof dateString === 'string' &&
    dateString.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    return dateString;
  }

  // Create date and format as local date to avoid timezone issues
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Output schema for API submission
const editEmployeeOutputSchema = editEmployeeInputSchema.transform(data => ({
  ...data,
  department_id: parseInt(data.department_id, 10),
  position_id: parseInt(data.position_id, 10),
  salary:
    typeof data.salary === 'string'
      ? parseFloat(data.salary.replace(/[^\d.-]/g, ''))
      : data.salary,
}));

type EditEmployeeFormData = z.infer<typeof editEmployeeInputSchema>;
type EditEmployeeOutputData = z.infer<typeof editEmployeeOutputSchema>;

export const EditEmployeeForm = ({ id }: EmployeeEditFormProps) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();

  const {
    data: optionsData,
    loading: optionsLoading,
    error: optionsError,
  } = useEmployeeForm();

  const form = useForm<EditEmployeeFormData>({
    resolver: zodResolver(editEmployeeInputSchema),
    defaultValues: {
      name: '',
      email: '',
      employee_id: '',
      department_id: '',
      position_id: '',
      salary: '',
      employment_status: 'Active',
      date_hired: '',
      generateTempPassword: '',
    },
  });

  // Watch the generateTempPassword field to enable/disable reset button
  const generatedTempPassword = form.watch('generateTempPassword');

  useEffect(() => {
    async function fetchEmployee() {
      try {
        setLoading(true);
        const employeeData = await hrService.getEmployeeById(id);

        // Format the data for the form
        form.reset({
          name: employeeData.name || '',
          email: employeeData.email || '',
          employee_id: employeeData.employee_id?.toString() || '',
          department_id: employeeData.department_id?.toString() || '',
          position_id: employeeData.position_id?.toString() || '',
          salary: employeeData.salary?.toString() || '',
          employment_status: employeeData.employment_status || 'Active',
          date_hired: formatDateForInput(employeeData.date_hired),
          generateTempPassword: '', // Always start empty
        });
      } catch (error) {
        console.error('Failed to fetch employee:', error);
        toast.error('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    }
    fetchEmployee();
  }, [id, form]);

  const onSubmit = async (data: EditEmployeeFormData) => {
    try {
      setSaving(true);

      const transformedData: EditEmployeeOutputData =
        editEmployeeOutputSchema.parse(data);

      await hrService.updateEmployee(id, {
        name: transformedData.name,
        email: transformedData.email,
        employee_id: transformedData.employee_id,
        department_id: transformedData.department_id,
        position_id: transformedData.position_id,
        salary: transformedData.salary,
        employment_status: transformedData.employment_status,
        date_hired: new Date(transformedData.date_hired),
        generatedTempPassword: data.generateTempPassword || undefined, // Send temp password if generated
      });

      navigate('/hr/employees');
      toast.success(`Employee ${data.employee_id} updated successfully`);
    } catch (err) {
      console.error(err);
      toast.error(getErrorMessage(err, 'Failed to update employee'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    const tempPassword = form.getValues('generateTempPassword');

    if (!tempPassword) {
      toast.error('Please generate a temporary password first');
      return;
    }

    try {
      setResettingPassword(true);
      // Use the generated temp password for reset
      const res = await hrService.resetEmployeePassword(id, tempPassword);
      toast.success(
        `Password reset successfully using generated temporary password`
      );
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error(getErrorMessage(error, 'Failed to reset password:'));
    } finally {
      setResettingPassword(false);
    }
  };

  const handleGenerateTempPassword = () => {
    const tempPassword = generateTempPassword(12);
    form.setValue('generateTempPassword', tempPassword);
    setTempPasswordGenerated(true);
    toast.success('Temporary password generated! Remember to save changes.');
  };

  const copyTempPasswordToClipboard = async () => {
    const tempPassword = form.getValues('generateTempPassword');
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        toast.success('Temporary password copied to clipboard');
      } catch (err) {
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  // Check if reset password should be enabled
  const isResetPasswordEnabled = Boolean(
    generatedTempPassword && generatedTempPassword.trim().length > 0
  );

  if (loading || optionsLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4'>
              <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              <span className='text-muted-foreground text-sm'>
                Loading employee data...
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (optionsError) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='py-12 text-center'>
            <AlertCircle className='text-destructive mx-auto mb-4 h-12 w-12' />
            <p className='text-destructive mb-6 text-sm font-medium'>
              {optionsError}
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
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
          onClick={() => navigate('/hr/employees', { replace: true })}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Employees
        </Button>

        <h1 className='text-2xl font-bold tracking-tight'>Edit Employee</h1>
        <p className='text-muted-foreground'>
          Update employee information and job details
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-4'>
        {/* Main Form */}
        <div className='lg:col-span-3'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
              {/* Personal Information Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <User className='text-primary h-5 w-5' />
                    </div>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='name'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-base font-medium'>
                          Full Name{' '}
                          <span className='text-muted-foreground'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <User className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              placeholder='Enter employee full name'
                              className='h-12 pl-10 text-base'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='email'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Email Address{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                              <Input
                                type='email'
                                placeholder='employee@metrobank.com.ph'
                                className='h-12 pl-10 text-base'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='employee_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Employee ID{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <FormControl>
                            <div className='relative'>
                              <Hash className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                              <Input
                                placeholder='XX-XXXXX'
                                className='h-12 pl-10 text-base'
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Job Information Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <Briefcase className='text-primary h-5 w-5' />
                    </div>
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormField
                      control={form.control}
                      name='department_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Department{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className='h-12 w-full text-base'>
                                <SelectValue placeholder='Select department' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {optionsData.departments?.map(dept => (
                                <SelectItem
                                  key={dept.id}
                                  value={dept.id.toString()}
                                  className='text-base'
                                >
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name='position_id'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Position{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className='h-12 w-full text-base'>
                                <SelectValue placeholder='Select position' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {optionsData.positions?.map(pos => (
                                <SelectItem
                                  key={pos.id}
                                  value={pos.id.toString()}
                                  className='text-base'
                                >
                                  {pos.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <FormItem className='relative py-2'>
                      <FormLabel className='text-base font-medium'>
                        Monthly Salary{' '}
                        <span className='text-muted-foreground'>*</span>
                      </FormLabel>
                      <FormControl>
                        <Controller
                          name='salary'
                          control={form.control}
                          render={({
                            field: { onChange, value, name, ref },
                            fieldState: { error },
                          }) => (
                            <CurrencyInput
                              ref={ref}
                              name={name}
                              value={value ?? ''}
                              onValueChange={newValue => {
                                onChange(newValue);
                              }}
                              className={`text-base ${error ? 'border-destructive' : ''}`}
                              placeholder='Enter monthly salary'
                              min={0}
                            />
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    <FormField
                      control={form.control}
                      name='employment_status'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Employment Status{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className='h-12 w-full text-base'>
                                <SelectValue placeholder='Select status' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value='Active' className='text-base'>
                                Active
                              </SelectItem>
                              <SelectItem
                                value='Resigned'
                                className='text-base'
                              >
                                Resigned
                              </SelectItem>
                              <SelectItem value='Retired' className='text-base'>
                                Retired
                              </SelectItem>
                              <SelectItem
                                value='Terminated'
                                className='text-base'
                              >
                                Terminated
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name='date_hired'
                    render={({ field }) => (
                      <FormItem className='flex flex-col'>
                        <FormLabel className='text-base font-medium'>
                          Date Hired{' '}
                          <span className='text-muted-foreground'>*</span>
                        </FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  'h-12 w-full justify-start text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className='mr-2 h-4 w-4' />
                                {field.value ? (
                                  format(new Date(field.value), 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={
                                field.value ? new Date(field.value) : undefined
                              }
                              onSelect={date => {
                                field.onChange(
                                  date ? format(date, 'yyyy-MM-dd') : ''
                                );
                              }}
                              disabled={date =>
                                date > new Date() ||
                                date < new Date('1900-01-01')
                              }
                              autoFocus
                              captionLayout='dropdown'
                              startMonth={new Date(1950, 0)}
                              endMonth={new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Security Section */}
              <Card>
                <CardHeader className='pb-4'>
                  <CardTitle className='flex items-center gap-2 text-lg'>
                    <div className='bg-primary/10 rounded-lg p-2'>
                      <Shield className='text-primary h-5 w-5' />
                    </div>
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <FormField
                    control={form.control}
                    name='generateTempPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-base font-medium'>
                          Temporary Password
                        </FormLabel>
                        <div className='flex flex-wrap gap-2'>
                          <FormControl>
                            <div className='relative flex-1'>
                              <Shield className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                              <Input
                                type={showTempPassword ? 'text' : 'password'}
                                placeholder='Click generate to create temporary password'
                                className='h-12 pr-20 pl-10 font-mono text-base'
                                readOnly
                                {...field}
                              />
                              <div className='absolute top-1/2 right-2 flex -translate-y-1/2 gap-1'>
                                {field.value && (
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0'
                                    onClick={copyTempPasswordToClipboard}
                                    title='Copy to clipboard'
                                  >
                                    <Copy className='h-3 w-3' />
                                  </Button>
                                )}
                                {field.value && (
                                  <Button
                                    type='button'
                                    variant='ghost'
                                    size='sm'
                                    className='h-8 w-8 p-0'
                                    onClick={() =>
                                      setShowTempPassword(!showTempPassword)
                                    }
                                    title={
                                      showTempPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                    }
                                  >
                                    {showTempPassword ? (
                                      <EyeOff className='h-3 w-3' />
                                    ) : (
                                      <Eye className='h-3 w-3' />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </FormControl>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={handleGenerateTempPassword}
                            className='h-12 w-full px-4 sm:w-auto'
                          >
                            <RefreshCw className='mr-2 h-4 w-4' />
                            Generate
                          </Button>
                        </div>
                        <p className='text-muted-foreground mt-2 text-xs'>
                          Generate a secure temporary password for the employee.
                          This will be sent with the update.
                        </p>
                        {tempPasswordGenerated && (
                          <div className='mt-2 rounded border border-green-200 bg-green-50 p-2 text-xs text-green-600'>
                            Temporary password generated successfully. Remember
                            to save changes to apply it.
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className='flex flex-col gap-4 sm:flex-row sm:justify-between'>
                <div className='flex flex-col gap-4 sm:flex-row'>
                  {/* <Button
                    type='button'
                    variant='destructive'
                    onClick={() => setDeleteDialogOpen(true)}
                    className='h-12 px-6 text-base sm:w-auto'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Delete Employee
                  </Button> */}
                  <Button
                    type='button'
                    variant='secondary'
                    onClick={handleResetPassword}
                    disabled={resettingPassword || !isResetPasswordEnabled}
                    className='h-12 px-6 text-base sm:w-auto'
                    title={
                      !isResetPasswordEnabled
                        ? 'Please generate a temporary password first'
                        : ''
                    }
                  >
                    {resettingPassword ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                        Resetting...
                      </>
                    ) : (
                      <>
                        <Shield className='mr-2 h-4 w-4' />
                        Reset Password
                      </>
                    )}
                  </Button>
                </div>

                <div className='flex flex-col gap-4 sm:flex-row'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => navigate('/hr/employees')}
                    className='h-12 px-8 text-base sm:w-auto'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    disabled={saving}
                    className='h-12 px-8 text-base sm:w-auto'
                  >
                    {saving ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className='mr-2 h-4 w-4' />
                        Save Changes
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
              <CardTitle className='text-lg'>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div className='text-sm'>
                  <p className='mb-2 font-medium'>Password Management</p>
                  <p className='text-muted-foreground mb-3 text-xs'>
                    Generate a temporary password first to enable the Reset
                    Password button. The password will be used for immediate
                    reset or included when saving changes.
                  </p>
                </div>

                <div className='text-sm'>
                  <p className='mb-2 font-medium'>Employee Management</p>
                  <p className='text-muted-foreground mb-3 text-xs'>
                    Reset Password requires a generated temporary password and
                    performs immediate password reset via separate API call.
                  </p>
                </div>

                <div className='text-sm'>
                  <p className='mb-2 font-medium'>Form Guidelines</p>
                  <ul className='text-muted-foreground space-y-1 text-xs'>
                    <li>• All required fields must be completed</li>
                    <li>• Email must use company domain</li>
                    <li>• Employee ID format: XX-XXXXX</li>
                    <li>
                      • Temporary passwords are 12 characters with mixed case,
                      numbers, and symbols
                    </li>
                    <li>• Generate password before using Reset Password</li>
                  </ul>
                </div>
              </div>

              <div className='border-t pt-4'>
                <p className='text-muted-foreground text-xs'>
                  Changes will take effect immediately after saving. Employee
                  will receive notifications of any changes to their profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
