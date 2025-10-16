import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
  DollarSign,
  Mail,
  Hash,
  Shield,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ArrowLeft,
  CalendarIcon,
} from 'lucide-react';

import { CurrencyInput } from '@/shared/components/currency-input';

// Import the password generator (you'll need to add this to your utils)
import { generateTempPassword } from '@/utils/generateTempPassword.js';
import {
  createUser,
  getDepartments,
  getPositions,
} from '../services/usersManagementService';
import { useMultiFetch } from '@/shared/hooks/useMultiFetch';
import type {
  DepartmentsResponse,
  PositionsResponse,
} from '@/features/employeeManagement/types/employeeTypes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

// Input schema for form validation (keeps strings for form inputs)
const createEmployeeInputSchema = z.object({
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
  email: z
    .email('Invalid email address')
    .refine(val => val.endsWith('@metrobank.com.ph'), {
      message: 'Email must use the @metrobank.com.ph domain',
    }),
  employee_id: z
    .string()
    .regex(/^\d{2}-\d{5}$/, 'Employee ID must follow the format NN-NNNNN'),
  role: z.enum(['Employee', 'HR', 'Admin'], {
    required_error: 'Please select a role',
  }),
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
  generateTempPassword: z
    .string()
    .min(1, 'Please generate a temporary password for the new employee'), // Required temporary password field
});

// Output schema for API submission (transforms to correct types)
const createEmployeeOutputSchema = createEmployeeInputSchema.transform(
  data => ({
    ...data,
    role: data.role,
    department_id: parseInt(data.department_id, 10),
    position_id: parseInt(data.position_id, 10),
    salary:
      typeof data.salary === 'string'
        ? parseFloat(data.salary.replace(/[^\d.-]/g, ''))
        : data.salary,
    date_hired: data.date_hired,
  })
);

type CreateEmployeeFormData = z.infer<typeof createEmployeeInputSchema>;
type CreateEmployeeOutputData = z.infer<typeof createEmployeeOutputSchema>;

export const AdminCreateUserPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState(false);
  const navigate = useNavigate();

  const {
    data: optionsData,
    loading: optionsLoading,
    error: optionsError,
  } = useMultiFetch<{
    departments: DepartmentsResponse;
    positions: PositionsResponse;
  }>(async () => {
    const [departments, positions] = await Promise.all([
      getDepartments(),
      getPositions(),
    ]);

    return { departments, positions };
  });

  const form = useForm<CreateEmployeeFormData>({
    resolver: zodResolver(createEmployeeInputSchema),
    defaultValues: {
      name: '',
      email: '',
      employee_id: '',
      role: undefined,
      department_id: '',
      position_id: '',
      salary: '',
      employment_status: 'Active',
      date_hired: new Date().toISOString().split('T')[0],
      generateTempPassword: '',
    },
  });

  const onSubmit = async (data: CreateEmployeeFormData) => {
    console.log('Payload: ', data);
    // Check if temporary password is generated
    if (!data.generateTempPassword || data.generateTempPassword.trim() === '') {
      toast.error(
        'Please generate a temporary password before creating the employee'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Transform the form data to the correct types for API submission
      const transformedData: CreateEmployeeOutputData =
        createEmployeeOutputSchema.parse(data);

      await createUser({
        name: transformedData.name,
        email: transformedData.email,
        employee_id: transformedData.employee_id,
        role: transformedData.role,
        department_id: transformedData.department_id,
        position_id: transformedData.position_id,
        salary: transformedData.salary,
        employment_status: transformedData.employment_status || 'Active',
        date_hired: transformedData.date_hired,
        generatedTempPassword: data.generateTempPassword, // Send temp password (required)
      });
      navigate('/admin/users');
      toast.success(`User ${data.employee_id} created successfully`);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateTempPassword = () => {
    const tempPassword = generateTempPassword(12);
    form.setValue('generateTempPassword', tempPassword);
    setTempPasswordGenerated(true);
    toast.success('Temporary password generated! Remember to save the form.');
  };

  const copyTempPasswordToClipboard = async () => {
    const tempPassword = form.getValues('generateTempPassword');
    if (tempPassword) {
      try {
        await navigator.clipboard.writeText(tempPassword);
        toast.success('Temporary password copied to clipboard');
      } catch (err) {
        console.error(err);
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  if (optionsLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <Card className='mx-auto max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='flex flex-col items-center gap-4'>
              <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2' />
              <span className='text-muted-foreground text-sm'>
                Loading form options...
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
          onClick={() => navigate('/admin/users', { replace: true })}
          className='mb-4'
        >
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Users
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>Create User</h1>
        <p className='text-muted-foreground'>
          Add a new user to the system with their basic information and access
          level
        </p>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Form */}
        <div className='lg:col-span-2'>
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

                    <FormField
                      control={form.control}
                      name='role'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className='text-base font-medium'>
                            Role{' '}
                            <span className='text-muted-foreground'>*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || ''}
                          >
                            <FormControl>
                              <SelectTrigger className='h-12 w-full text-base'>
                                <SelectValue placeholder='Select role' />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem
                                value='Employee'
                                className='text-base'
                              >
                                Employee
                              </SelectItem>
                              <SelectItem value='HR' className='text-base'>
                                HR
                              </SelectItem>
                              <SelectItem value='Admin' className='text-base'>
                                System Admin
                              </SelectItem>
                            </SelectContent>
                          </Select>
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
                              {optionsData?.departments?.map(dept => (
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
                              {optionsData?.positions?.map(pos => (
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
                          Temporary Password{' '}
                          <span className='text-muted-foreground'>*</span>
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
                          Generate a secure temporary password for the new user.
                          This password is required to create the user account.
                        </p>
                        {tempPasswordGenerated && (
                          <div className='mt-2 rounded border border-green-200 bg-green-50 p-2 text-xs text-green-600'>
                            Temporary password generated successfully. Remember
                            to save the form to create the user with this
                            password.
                          </div>
                        )}

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
                  onClick={() => navigate('/admin/users', { replace: true })}
                  className='h-12 px-8 text-base sm:w-auto'
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
                      Creating User...
                    </>
                  ) : (
                    'Create User'
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
                  <User className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Full Name</p>
                    <p className='text-muted-foreground text-xs'>
                      Enter the user's complete legal name
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <Shield className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Role</p>
                    <p className='text-muted-foreground text-xs'>
                      Select the access level: Employee, HR, or System Admin
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <Mail className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Email</p>
                    <p className='text-muted-foreground text-xs'>
                      Must use @metrobank.com.ph domain
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <Hash className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Employee ID</p>
                    <p className='text-muted-foreground text-xs'>
                      Format: XX-XXXXX (e.g., 12-34567)
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <DollarSign className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Salary</p>
                    <p className='text-muted-foreground text-xs'>
                      Monthly salary with automatic formatting
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 text-sm'>
                  <Shield className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  <div>
                    <p className='font-medium'>Temporary Password</p>
                    <p className='text-muted-foreground text-xs'>
                      Required: Generate a secure 12-character password for the
                      new user
                    </p>
                  </div>
                </div>
              </div>

              <div className='border-t pt-4'>
                <p className='text-muted-foreground text-xs'>
                  All fields marked with * are required. Generate a temporary
                  password to provide initial login credentials for the new
                  user.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
