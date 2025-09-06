import { z } from 'zod';

// TODO: Add stricter constraint in the future
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['Employee', 'HR', 'Admin']),
  date_hired: z.string().optional(), // "YYYY-MM-DD"
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
