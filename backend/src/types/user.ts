// Backend types, NOTE: never send this to the frontend, use type `UserResponse` instead
export interface User {
  id: number;
  // employee fields
  employee_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'Employee' | 'HR' | 'Admin';
  salary: number;
  date_hired: Date;
  employment_status: 'Active' | 'Resigned' | 'Retired' | 'Terminated';

  // security fields
  created_at: Date;
  failed_attempts: number;
  locked_until?: Date | null;
  password_last_changed?: Date | null;
  password_expired: boolean;
  temp_password: boolean;
  temp_password_expires?: Date | null;
  is_twofa_enabled: boolean;
  twofa_secret?: string | null;

  // foreign keys
  department_id?: number | null; // reference to departments
  position_id?: number | null; // reference to positions
}

export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  title: string;
}

export type Role = User['role'];
export type EmploymentStatus = User['employment_status'];
