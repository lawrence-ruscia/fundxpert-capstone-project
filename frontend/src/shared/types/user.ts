import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

export interface User {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  role: 'Employee' | 'HR' | 'Admin';
  department: string | null;
  position: string | null;
  salary: number;
  employment_status: EmploymentStatus;
  date_hired: string;
  created_at: string;
}

export type Role = User['role'];

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  target_id?: number | null;
  ip_address?: string | null;
  details?: string;
  timestamp: string;

  actor_name: string;
}
