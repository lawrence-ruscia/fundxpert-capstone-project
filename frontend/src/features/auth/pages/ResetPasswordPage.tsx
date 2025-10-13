import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Shield,
  ArrowLeft,
  Mail,
  KeyRound,
} from 'lucide-react';
import { authService } from '../services/authService';
import { getErrorMessage } from '@/shared/api/getErrorMessage';

// Step 1: Verify identity
const verifyIdentitySchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  currentPassword: z.string().min(1, 'Current password is required'),
});

// Step 2: Create new password
const createPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one digit')
      .regex(
        /[^A-Za-z0-9]/,
        'Password must contain at least one special character'
      ),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type VerifyIdentityData = z.infer<typeof verifyIdentitySchema>;
type CreatePasswordData = z.infer<typeof createPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [userId, setUserId] = useState<number | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const verifyForm = useForm<VerifyIdentityData>({
    resolver: zodResolver(verifyIdentitySchema),
    defaultValues: {
      email: '',
      currentPassword: '',
    },
  });

  const passwordForm = useForm<CreatePasswordData>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Password strength indicators
  const newPassword = passwordForm.watch('newPassword');
  const requirements = [
    { label: 'At least 8 characters', met: newPassword.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { label: 'One number', met: /[0-9]/.test(newPassword) },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  const onVerifyIdentity = async (data: VerifyIdentityData) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      // Verify the user's identity with email and current password
      const loginResponse = await authService.login({
        email: data.email,
        password: data.currentPassword,
      });

      // Extract userId from the login response
      let extractedUserId: number;
      if ('userId' in loginResponse) {
        extractedUserId = loginResponse.userId;
      } else if ('user' in loginResponse) {
        extractedUserId = loginResponse.user.id;
      } else {
        throw new Error('Unable to verify identity');
      }

      setUserId(extractedUserId);
      setVerifiedEmail(data.email);
      setStep(2);
      toast.success('Identity verified! Now create your new password.');
    } catch (err) {
      console.error('Verification error:', err);
      const errorMessage = getErrorMessage(err, 'FFailed to verify identity');
      setServerError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCreatePassword = async (data: CreatePasswordData) => {
    if (!userId) {
      setServerError('Session expired. Please start over.');
      setStep(1);
      return;
    }

    try {
      setIsSubmitting(true);
      setServerError(null);

      await authService.resetPassword(userId, data.newPassword);

      navigate('/auth/login', { replace: true });
      toast.success(
        'Password reset successfully! Please log in with your new password.'
      );
    } catch (err) {
      console.error('Password reset error:', err);
      const errorMessage = getErrorMessage(err, 'Failed to reset password');
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setServerError(null);
      passwordForm.reset();
    } else {
      navigate('/auth/login');
    }
  };

  return (
    <div className='w-full space-y-4'>
      {/* Back Button */}
      <Button variant='ghost' size='sm' onClick={handleBack} className='w-fit'>
        <ArrowLeft className='mr-2 h-4 w-4' />
        {step === 2 ? 'Back to Verification' : 'Back to Login'}
      </Button>

      {/* Password Requirements Sidebar - Desktop only (Step 2) */}
      {step === 2 && (
        <div className='fixed top-24 right-8 hidden w-64 xl:block'>
          <Card className='shadow-lg'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm font-semibold'>
                <Shield className='h-4 w-4' />
                Password Requirements
              </CardTitle>
              <CardDescription className='text-xs'>
                Your new password must meet all criteria
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-2.5'>
              {requirements.map((req, index) => (
                <div key={index} className='flex items-start gap-2.5 text-sm'>
                  {req.met ? (
                    <CheckCircle2 className='mt-0.5 h-4 w-4 flex-shrink-0 text-green-600' />
                  ) : (
                    <AlertCircle className='text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0' />
                  )}
                  <span
                    className={
                      req.met
                        ? 'font-medium text-green-600'
                        : 'text-muted-foreground'
                    }
                  >
                    {req.label}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className='w-full'>
        <CardHeader className='pb-3 text-center'>
          <div className='bg-primary/10 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full'>
            <KeyRound className='text-primary h-7 w-7' />
          </div>
          <CardTitle className='text-xl'>Reset Your Password</CardTitle>
          <CardDescription>
            {step === 1
              ? 'Verify your identity to continue'
              : 'Create a strong new password'}
          </CardDescription>

          {/* Progress Indicator */}
          <div className='mt-4 flex items-center justify-center gap-2'>
            <div className='flex items-center gap-2'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 1
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-green-600 text-white'
                }`}
              >
                {step === 1 ? '1' : <CheckCircle2 className='h-4 w-4' />}
              </div>
              <span className='text-xs font-medium'>Verify</span>
            </div>
            <div className='bg-border h-px w-12' />
            <div className='flex items-center gap-2'>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                  step === 2
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                2
              </div>
              <span className='text-xs font-medium'>New Password</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className='pt-0'>
          {/* Server Error Alert */}
          {serverError && (
            <Alert variant='destructive' className='mb-4'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-sm font-medium'>
                {serverError}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Verify Identity */}
          {step === 1 && (
            <>
              <Alert className='mb-4'>
                <Lock className='h-4 w-4' />
                <AlertDescription className='text-sm'>
                  Enter your email and current password to verify your identity
                </AlertDescription>
              </Alert>

              <Form {...verifyForm}>
                <form
                  onSubmit={verifyForm.handleSubmit(onVerifyIdentity)}
                  className='space-y-4'
                >
                  {/* Email Field */}
                  <FormField
                    control={verifyForm.control}
                    name='email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Email Address{' '}
                          <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              type='email'
                              placeholder='Enter your email'
                              className='h-11 pl-10'
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Current Password Field */}
                  <FormField
                    control={verifyForm.control}
                    name='currentPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Current Password{' '}
                          <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Lock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              type={showCurrentPassword ? 'text' : 'password'}
                              placeholder='Enter your current password'
                              className='h-11 pr-10 pl-10'
                              {...field}
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 p-0'
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                            >
                              {showCurrentPassword ? (
                                <EyeOff className='h-4 w-4' />
                              ) : (
                                <Eye className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type='submit'
                    className='h-11 w-full'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Shield className='mr-2 h-4 w-4' />
                        Verify Identity
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {/* Step 2: Create New Password */}
          {step === 2 && (
            <>
              <Alert className='mb-4'>
                <CheckCircle2 className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-sm'>
                  Identity verified for <strong>{verifiedEmail}</strong>
                </AlertDescription>
              </Alert>

              {/* Password Requirements - Mobile/Tablet View */}
              <Card className='mb-4 border-dashed xl:hidden'>
                <CardHeader className='pt-3 pb-2'>
                  <CardTitle className='flex items-center gap-2 text-xs font-semibold'>
                    <Shield className='h-3.5 w-3.5' />
                    Password Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-1.5 pt-0'>
                  {requirements.map((req, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-xs'
                    >
                      {req.met ? (
                        <CheckCircle2 className='h-3.5 w-3.5 flex-shrink-0 text-green-600' />
                      ) : (
                        <AlertCircle className='text-muted-foreground h-3.5 w-3.5 flex-shrink-0' />
                      )}
                      <span
                        className={
                          req.met
                            ? 'font-medium text-green-600'
                            : 'text-muted-foreground'
                        }
                      >
                        {req.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onCreatePassword)}
                  className='space-y-4'
                >
                  {/* New Password Field */}
                  <FormField
                    control={passwordForm.control}
                    name='newPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          New Password{' '}
                          <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Lock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              type={showNewPassword ? 'text' : 'password'}
                              placeholder='Enter your new password'
                              className='h-11 pr-10 pl-10'
                              {...field}
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 p-0'
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                            >
                              {showNewPassword ? (
                                <EyeOff className='h-4 w-4' />
                              ) : (
                                <Eye className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password Field */}
                  <FormField
                    control={passwordForm.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className='text-sm font-medium'>
                          Confirm New Password{' '}
                          <span className='text-destructive'>*</span>
                        </FormLabel>
                        <FormControl>
                          <div className='relative'>
                            <Lock className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                            <Input
                              type={showConfirm ? 'text' : 'password'}
                              placeholder='Confirm your new password'
                              className='h-11 pr-10 pl-10'
                              {...field}
                            />
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='absolute top-1/2 right-2 h-7 w-7 -translate-y-1/2 p-0'
                              onClick={() => setShowConfirm(!showConfirm)}
                            >
                              {showConfirm ? (
                                <EyeOff className='h-4 w-4' />
                              ) : (
                                <Eye className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <Button
                    type='submit'
                    className='h-11 w-full'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
                        Resetting Password...
                      </>
                    ) : (
                      <>
                        <KeyRound className='mr-2 h-4 w-4' />
                        Reset Password
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {/* Help Text */}
          <div className='mt-4 border-t pt-4 text-center'>
            <p className='text-muted-foreground text-xs'>
              {step === 1
                ? 'Your identity will be verified before you can reset your password'
                : "You'll be redirected to login after resetting your password"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
