import type { LoginSchema } from '../schemas/loginSchema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from './password-input';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/loginSchema';
import { Link } from 'react-router-dom';
import { AlertCircle, LogIn, Mail, Lock } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';

type LoginFormProps = {
  onSubmit: (data: LoginSchema, setError: UseFormSetError<LoginSchema>) => void;
};

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFormSubmit = (data: LoginSchema) => {
    onSubmit(data, form.setError);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className='space-y-6'
      >
        {/* Root Error Alert */}
        {form.formState.errors.root && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {form.formState.errors.root.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Email Field */}
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-base font-medium'>
                Company Email <span className='text-destructive'>*</span>
              </FormLabel>
              <FormControl>
                <div className='relative'>
                  <Mail className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    type='email'
                    placeholder='your.email@company.com'
                    className='h-12 pl-10 text-base'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <div className='flex items-center justify-between'>
                <FormLabel className='text-base font-medium'>
                  Password <span className='text-destructive'>*</span>
                </FormLabel>
                <Link
                  to='/auth/reset-password'
                  className='text-primary text-sm underline-offset-4 hover:underline'
                >
                  Forgot password?
                </Link>
              </div>
              <FormControl>
                <div className='relative'>
                  <Lock className='text-muted-foreground absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2' />
                  <PasswordInput
                    placeholder='Enter your password'
                    className='h-12 pl-10 text-base'
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button
          type='submit'
          className='h-12 w-full text-base'
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <div className='mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white' />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className='mr-2 h-4 w-4' />
              Login
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
