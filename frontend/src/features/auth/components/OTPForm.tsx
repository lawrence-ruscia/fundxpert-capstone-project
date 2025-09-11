import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { Link } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { otpSchema, type OTPSchema } from '../schemas/otpSchema';
import type { LoginResponse } from '../pages/LoginPage';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router-dom';

type OTPFormProps = {
  userId: number | null;
  setToken: (token: string) => void;
};

export const OTPForm = ({ userId, setToken }: OTPFormProps) => {
  const form = useForm<OTPSchema>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const navigate = useNavigate();

  const otp = form.watch('otp');

  const handle2FALogin = async () => {
    const response: LoginResponse = await authService.verify2FA(userId, otp);
    console.log(response);

    if ('token' in response && response.token !== null) {
      setToken(response.token);
      alert('✅ Logged in with 2FA!');
      navigate('/dashboard');
    } else {
      alert('❌ Invalid 2FA code');
    }
  };

  return (
    <Card className='gap-4'>
      <CardHeader>
        <CardTitle className='text-base tracking-tight'>
          Two-factor Authentication
        </CardTitle>
        <CardDescription>
          Please enter the authentication code send to your authenticator app.{' '}
          <br />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handle2FALogin)}
            className={cn('grid gap-2')}
          >
            <FormField
              control={form.control}
              name='otp'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='sr-only'>One-Time Password</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      {...field}
                      containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              className='mt-2'
              disabled={otp.length < 6 || form.formState.isSubmitting}
            >
              Verify
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Haven't received it?{' '}
          <a
            href='/sign-in'
            className='hover:text-primary underline underline-offset-4'
          >
            Resend a new code.
          </a>
        </p>
      </CardFooter>
    </Card>
  );
};
