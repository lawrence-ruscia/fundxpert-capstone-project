import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useNavigate, useParams } from 'react-router-dom';
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
  User,
  Briefcase,
  Calendar,
  Mail,
  Hash,
  Shield,
  Save,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { CurrencyInput } from '@/shared/components/currency-input';

// Import the password generator (you'll need to add this to your utils)
import { generateTempPassword } from '@/utils/generateTempPassword.js';
import {
  getDepartments,
  getPositions,
  resetUserPassword,
  updateUser,
} from '../services/usersManagementService.js';
import { getUserById } from '@/features/dashboard/admin/services/adminService.js';
import { type Role, type User as UserType } from '@/shared/types/user.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';

import { LockUserDialog } from '../components/LockUserDialog.js';
import { UnlockUserDialog } from '../components/UnlockUserDialog.js';
import { ToggleLockButton } from '../components/ToggleLockButton.js';
import { useSmartPolling } from '@/shared/hooks/useSmartPolling.js';
import { usePersistedState } from '@/shared/hooks/usePersistedState.js';

// Input schema for form validation
const updateUserInputSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
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
  generateTempPassword: z.string().optional(), // Optional temporary password fieldpassword field
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
const updateUserOutputSchema = updateUserInputSchema.transform(data => ({
  ...data,
  role: data.role,
  department_id: parseInt(data.department_id, 10),
  position_id: parseInt(data.position_id, 10),
  salary:
    typeof data.salary === 'string'
      ? parseFloat(data.salary.replace(/[^\d.-]/g, ''))
      : data.salary,
}));

type UpdateUserFormData = z.infer<typeof updateUserInputSchema>;
type UpdateUserOutputData = z.infer<typeof updateUserOutputSchema>;

export const AdminUpdateUserPage = () => {
  const { userId } = useParams();
  const [saving, setSaving] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPasswordGenerated, setTempPasswordGenerated] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [openLock, setOpenLock] = useState(false);
  const [openUnlock, setOpenUnlock] = useState(false);

  const [autoRefreshEnabled] = usePersistedState(
    'admin-dashboard-auto-refresh',
    true
  );

  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUsersData = useCallback(async () => {
    const [departments, positions, user] = await Promise.all([
      getDepartments(),
      getPositions(),
      getUserById(Number(userId)),
    ]);

    console.log('Locked: ', user.locked_until);

    return { departments, positions, user };
  }, [userId]);

  const { data, loading, error, refresh, lastUpdated } = useSmartPolling(
    fetchUsersData,
    {
      context: 'users',
      enabled: autoRefreshEnabled,
      pauseWhenHidden: true,
      pauseWhenInactive: true,
    }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const navigate = useNavigate();

  const form = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserInputSchema),
    defaultValues: {
      name: '',
      email: '',
      employee_id: '',
      role: undefined,
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

  // Update form when data changes
  useEffect(() => {
    if (data?.user) {
      form.reset({
        name: data.user.name || '',
        email: data.user.email || '',
        employee_id: data.user.employee_id?.toString() || '',
        role: (data.user.role?.toString() as Role) || '',
        department_id: data.user.department_id?.toString() || '',
        position_id: data.user.position_id?.toString() || '',
        salary: data.user.salary?.toString() || '',
        employment_status: data.user.employment_status || 'Active',
        date_hired: formatDateForInput(data.user.date_hired ?? new Date()),
        generateTempPassword: '', // Always start empty
      });
    }
  }, [data, form]);

  const onSubmit = async (formData: UpdateUserFormData) => {
    try {
      setSaving(true);

      const transformedData: UpdateUserOutputData =
        updateUserOutputSchema.parse(formData);

      await updateUser(Number(userId), {
        name: transformedData.name,
        email: transformedData.email,
        employee_id: transformedData.employee_id,
        role: transformedData.role,
        department_id: transformedData.department_id,
        position_id: transformedData.position_id,
        salary: transformedData.salary,
        employment_status: transformedData.employment_status,
        date_hired: new Date(transformedData.date_hired),
        generatedTempPassword: formData.generateTempPassword || undefined,
      });

      navigate('/admin/users');
      toast.success(`User ${formData.employee_id} updated successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user');
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
      await resetUserPassword(Number(userId), tempPassword);
      toast.success(
        `Password reset successfully using generated temporary password`
      );
    } catch (error) {
      console.error('Failed to reset password:', error);
      toast.error('Failed to reset password');
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
        console.error(err);
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  // Check if reset password should be enabled
  const isResetPasswordEnabled = Boolean(
    generatedTempPassword && generatedTempPassword.trim().length > 0
  );

  if (loading) {
    return <LoadingSpinner text={'Loading user data...'} />;
  }

  if (error) {
    return <DataError />;
  }

  if (!data?.user) {
    return <DataError message='User not found' />;
  }

  return (
    <div className='container px-4'>
      {/* Header */}
      <div className='mb-8'>
        <div>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => navigate('/admin/users', { replace: true })}
            className='p-2'
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
        </div>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div className='flex flex-col gap-3'>
            <div>
              <h1 className='text-2xl font-bold tracking-tight'>Update User</h1>
              <p className='text-muted-foreground'>
                Update user information and their access levels
              </p>
            </div>
          </div>
          {/* Refresh Controls */}
          <div className='flex flex-wrap items-center gap-3'>
            {/* Last Updated */}
            {lastUpdated && (
              <div className='text-muted-foreground text-right text-sm'>
                <p className='font-medium'>Last updated</p>
                <p className='text-xs'>
                  {lastUpdated.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {/* Manual Refresh Button */}
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={isRefreshing}
              className='gap-2'
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
        {/* Auto-refresh Status Banner */}
        {!autoRefreshEnabled && (
          <div className='bg-muted/50 mt-4 mb-8 flex items-center gap-2 rounded-lg border border-dashed px-4 py-2.5'>
            <AlertCircle className='text-muted-foreground h-4 w-4' />
            <p className='text-muted-foreground text-sm'>
              Auto-refresh is disabled. Data will only update when manually
              refreshed.
            </p>
          </div>
        )}

        {/* Loading Overlay for Background Refresh */}
        {loading && data && (
          <div className='bg-background/80 fixed inset-0 z-50 flex items-start justify-center pt-20 backdrop-blur-sm'>
            <div className='bg-card flex items-center gap-2 rounded-lg border p-4 shadow-lg'>
              <RefreshCw className='h-4 w-4 animate-spin' />
              <span className='text-sm font-medium'>Updating data...</span>
            </div>
          </div>
        )}
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
                              {data?.departments?.map(dept => (
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
                              {data?.positions?.map(pos => (
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
                      <FormItem className='md:max-w-md'>
                        <FormLabel className='text-base font-medium'>
                          Date Hired{' '}
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
                  <ToggleLockButton
                    user={data.user}
                    actionLoading={actionLoading}
                    onLockClick={() => setOpenLock(true)}
                    onUnlockClick={() => setOpenUnlock(true)}
                  />
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
                    onClick={() => navigate('/admin/users')}
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
                  <p className='mb-2 font-medium'>Account Lock/Unlock</p>
                  <p className='text-muted-foreground mb-3 text-xs'>
                    Lock an account to prevent login attempts immediately.
                    Unlock to restore access. Locked accounts will see a message
                    indicating when they can try again.
                  </p>
                </div>

                <div className='text-sm'>
                  <p className='mb-2 font-medium'>User Management</p>
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
                  Changes will take effect immediately after saving. User will
                  receive notifications of any changes to their profile.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <LockUserDialog
        open={openLock}
        onOpenChange={setOpenLock}
        setActionLoading={setActionLoading}
        userId={userId ?? ''}
        userName={data?.user?.name}
        refresh={refresh}
      />
      <UnlockUserDialog
        open={openUnlock}
        onOpenChange={setOpenUnlock}
        setActionLoading={setActionLoading}
        userId={userId ?? ''}
        userName={data?.user?.name}
        lockExpiresAt={data?.user?.locked_until}
        refresh={refresh}
      />
    </div>
  );
};
