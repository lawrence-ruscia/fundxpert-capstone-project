import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

export type User = {
  id: number;
  // Employement fields
  employee_id: string;
  name: string;
  email: string;
  role: 'Employee' | 'HR' | 'Admin';
  department: string | null;
  position: string | null;
  department_id: number;
  position_id: number;
  salary: number;
  employment_status: EmploymentStatus;
  date_hired: string;

  // Security fields
  failed_attempts: number;
  locked_until?: string | null;
  password_expired: boolean;
  temp_password: boolean;
  is_twofa_enabled: boolean;
  password_last_changed?: string | null;
  created_at: string;
};

export type Role = User['role'];

export type AccountStatus = 'Locked' | 'Temp Password' | 'Expired' | 'Active';
