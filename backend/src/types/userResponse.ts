import type { Department, Position } from './user.js';

// Frontend types
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: 'Employee' | 'HR' | 'Admin';

  department?: Department | null;
  position?: Position | null;
  salary: number;
  employment_status: 'Active' | 'Resigned' | 'Retired';
  date_hired: string;
  created_at: string;
}
