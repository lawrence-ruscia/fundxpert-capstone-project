import { z } from 'zod';
export const loginSchema = z.object({
  email: z.email('Company email address is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchema = z.infer<typeof loginSchema>;
