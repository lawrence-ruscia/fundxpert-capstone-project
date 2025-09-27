import { api } from '@/shared/api/api';
import type {
  HRCreateEmployeeResponse,
  HRDepartmentsResponse,
  HREmployeeRecord,
  HREmployeesResponse,
  HRPositionsResponse,
  HRResetPassResponse,
  HRUpdateEmployeeResponse,
} from '../types/employeeTypes';
import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';

export const createEmployee = async (payload: {
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  position_id: number;
  salary: number;
  date_hired: string;
}): Promise<HRCreateEmployeeResponse> => {
  const { data } = await api.post('/hr/employees', payload);
  return data;
};

export const getEmployees = async (query?: {
  department?: string;
  status?: string;
}): Promise<HREmployeesResponse> => {
  const { data } = await api.get('/hr/employees', { params: query });
  return data;
};

export const getDepartments = async (): Promise<HRDepartmentsResponse> => {
  try {
    const { data } = await api.get('/hr/departments');

    return data;
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to fetch departments');
  }
};

export const getPositions = async (): Promise<HRPositionsResponse> => {
  try {
    const { data } = await api.get('/hr/positions');

    return data;
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to fetch positions');
  }
};

export const getEmployeeById = async (
  id: number
): Promise<HREmployeeRecord> => {
  const { data } = await api.get(`/hr/employees/${id}`);
  return data;
};

export const updateEmployee = async (
  id: number,
  payload: Partial<{
    name: string;
    email: string;
    employee_id: string;
    department_id: number;
    position_id: number;
    salary: number;
    employment_status: EmploymentStatus;
    date_hired: Date;
    generatedTempPassword: string;
  }>
): Promise<HRUpdateEmployeeResponse> => {
  const { data } = await api.put(`/hr/employees/${id}`, payload);
  return data;
};

export const resetEmployeePassword = async (
  id: number,
  generatedPassword: string
): Promise<HRResetPassResponse> => {
  const { data } = await api.put(`/hr/employees/${id}/reset-password`, {
    generatedPassword,
  });
  return data;
};

export const updateEmploymentStatus = async (
  id: number,
  status: 'Active' | 'Resigned' | 'Retired' | 'Terminated'
): Promise<HRUpdateEmployeeResponse> => {
  const { data } = await api.put(`/hr/employees/${id}/status`, { status });
  return data;
};
