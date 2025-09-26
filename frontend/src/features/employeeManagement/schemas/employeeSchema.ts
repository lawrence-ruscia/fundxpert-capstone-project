import { z } from 'zod';
export const employementStatusSchema = z.union([
  z.literal('Active'),
  z.literal('Resigned'),
  z.literal('Retired'),
  z.literal('Terminated'),
]);

export const employeeSchema = z.object({
  id: z.number(),
  employee_id: z.number(),
  name: z.string(),
  email: z.string(),
  salary: z.number(),
  employment_status: employementStatusSchema,
  date_hired: z.string(),
  department: z.string(),
  position: z.string(),
});

export const employeeListSchema = z.array(employeeSchema);
