import { z } from 'zod';
export const otpSchema = z.object({
  otp: z
    .string()
    .min(6, 'Please enter the 6-digit code.')
    .max(6, 'Please enter the 6-digit code.'),
});

export type OTPSchema = z.infer<typeof otpSchema>;
