import { z } from 'zod';

export const registerSchema = z.object({
  employee_id: z
    .string()
    .regex(/^\d{2}-\d{5}$/, 'Employee ID must follow the format NN-NNNNN'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z
    .email('Invalid email address')
    .refine(val => val.endsWith('@metrobank.com.ph'), {
      message: 'Email must use the @metrobank.com.ph domain',
    }),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters') // baseline
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
  role: z.enum(['Employee', 'HR', 'Admin']),
  date_hired: z.string().optional(), // "YYYY-MM-DD"
});

export const loginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const resetPassSchema = z.object({
  userId: z.string('Invalid userId'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters') // baseline
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character'
    ),
});
