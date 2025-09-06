export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Employee' | 'HR' | 'Admin';
  date_hired: Date;
  created_at: Date;
}

export type Role = User['role'];
