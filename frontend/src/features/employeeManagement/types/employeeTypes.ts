import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

export type HREmployeeRecord = {
  id: number;
  employee_id: string;
  name: string;
  email: string;
  department_id: number;
  position_id: number;
  role: 'Employee';
  salary: number;
  employment_status: EmploymentStatus;
  date_hired: string;
  department: string;
  position: string;
};

export type HREmployeesResponse = HREmployeeRecord[];

type HRDepartmentRecord = {
  id: number;
  name: string;
};
export type HRDepartmentsResponse = HRDepartmentRecord[];

type HRPositionsRecord = {
  id: number;
  title: string;
};
export type HRPositionsResponse = HRPositionsRecord[];

export type HRCreateEmployeeResponse = {
  id: number;
  name: string;
  email: string;
  employee_id: number;
  role: 'Employee';
  salary: number;
  department_id: number;
  position_id: number;
  employment_status: EmploymentStatus;
  date_hired: string;
  temp_password: boolean;
  temp_password_expires: string;
};

export type HRUpdateEmployeeResponse = {
  id: number;
  name: string;
  email: string;
  employee_id: number;
  role: 'Employee';
  salary: number;
  department_id: number;
  position_id: number;
  employment_status: EmploymentStatus;
  date_hired: string;
};

export type HRResetPassResponse = { tempPassword: string; expiresAt: string };
