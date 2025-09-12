import type { LoginSchema } from '../schemas/loginSchema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PasswordInput } from './password-input';
import { useForm, type UseFormSetError } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/loginSchema';

type LoginFormProps = {
  onSubmit: (data: LoginSchema, setError: UseFormSetError<LoginSchema>) => void;
};

export const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <form
      onSubmit={handleSubmit(data => onSubmit(data, setError))}
      className='mx-auto flex max-w-3xl flex-col gap-4'
    >
      <div>
        <div className='space-y-2'>
          <label
            id='emailLabel'
            htmlFor='email'
            className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
              errors.email ? 'text-red-500' : ''
            }`}
          >
            Company Email *
          </label>
          <Input
            id='email'
            type='email'
            placeholder='Your company email'
            className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
            {...register('email')}
          />
          {errors.email && (
            <p className='text-sm font-medium text-red-500'>
              {errors.email.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <label
              htmlFor='password'
              className={`text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                errors.password ? 'text-red-500' : ''
              }`}
            >
              Password *
            </label>
            <a
              href='#'
              className='hover:text-primary ml-auto inline-block text-sm underline-offset-4 hover:underline'
            >
              Forgot your password?
            </a>
          </div>

          <PasswordInput
            className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
            required
            id='password'
            placeholder='Your password'
            {...register('password')}
          />
          {errors.password && (
            <p className='text-sm font-medium text-red-500'>
              {errors.password.message}
            </p>
          )}
        </div>
      </div>

      <p className='text-sm font-medium text-red-500'>
        {errors.root && errors.root.message}
      </p>

      <Button className='mt-1.5 w-full' type='submit' disabled={isSubmitting}>
        Login
      </Button>
    </form>
  );
};
