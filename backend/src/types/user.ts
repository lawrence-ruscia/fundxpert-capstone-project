export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: 'Employee' | 'HR' | 'Admin';
  date_hired: Date;
  created_at: Date;
  failed_attempts: number;
  locked_until?: Date | null;
  password_last_changed?: Date | null;
  password_expired: boolean;
}

export type Role = User['role'];
