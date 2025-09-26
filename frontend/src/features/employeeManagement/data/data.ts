import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

export const callTypes = new Map<EmploymentStatus, string>([
  [
    'Active',
    'bg-green-500 hover:bg-green-600 text-white dark:bg-green-600 dark:hover:bg-green-700',
  ],
  [
    'Resigned',
    'bg-orange-500 hover:bg-orange-600 text-white dark:bg-orange-600 dark:hover:bg-orange-700',
  ],
  [
    'Retired',
    'bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-700',
  ],
  [
    'Terminated',
    'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700',
  ],
]);
