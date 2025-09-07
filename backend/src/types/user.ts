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
  temp_password: boolean;
  temp_password_expires?: Date | null;
}

export type Role = User['role'];
