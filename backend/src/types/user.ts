export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Employee' | 'HR' | 'Admin';
  date_hired: Date;
  created_at: Date;
  failed_attempts?: number;
  locked_until?: Date | null;
}

export type Role = User['role'];
