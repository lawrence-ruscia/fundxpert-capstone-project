import { z } from 'zod';

export const ContributionPeriodSchema = z.enum([
  '3m',
  '6m',
  '1y',
  'all',
  'year',
]);

export const ContributionRecordSchema = z.object({
  month: z.string(),
  year: z.string(),
  employee: z.number(),
  employer: z.number(),
  vested: z.number(),
  total: z.number(),
});

export const ContributionTotalsSchema = z.object({
  employee: z.number(),
  employer: z.number(),
  vested: z.number(),
  grand_total: z.number(),
});

export const EmployeeContributionsResponseSchema = z.object({
  period: ContributionPeriodSchema.optional(),
  contributions: z.array(ContributionRecordSchema),
  totals: ContributionTotalsSchema,
});
