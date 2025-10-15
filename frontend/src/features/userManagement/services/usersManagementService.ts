import type { EmploymentStatus } from '@/features/dashboard/employee/types/employeeOverview';
import type {
  DepartmentsResponse,
  UpdateEmployeeResponse,
  PositionsResponse,
  ResetPassResponse,
} from '@/features/employeeManagement/types/employeeTypes';
import { api } from '@/shared/api/api';
import type { Role } from '@/shared/types/user';

export const createUser = async (payload: {
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  position_id: number;
  salary: number;
  employment_status: string;
  date_hired: string;
  role: string;
  generatedTempPassword: string;
}) => {
  console.log(JSON.stringify(payload));
  const res = await api.post('/admin/users', payload);

  return res.data;
};

export const updateUser = async (
  userId: number,
  payload: Partial<{
    name: string;
    email: string;
    employee_id: string;
    role: Role;
    department_id: number;
    position_id: number;
    salary: number;
    employment_status: EmploymentStatus;
    date_hired: Date;
    generatedTempPassword: string;
  }>
): Promise<UpdateEmployeeResponse> => {
  console.log('Payload: ', payload);
  const { data } = await api.patch(`/admin/users/${userId}`, payload);
  return data;
};

/**
 * Reset a user’s password — returns a temporary password
 */
export const resetUserPassword = async (
  userId: number,
  generatedTempPassword: string
): Promise<ResetPassResponse> => {
  const { data } = await api.put(`/admin/users/${userId}/reset-password`, {
    generatedTempPassword,
  });
  return data;
};

export const exportUsersCSV = async (params?: {
  start?: string;
  end?: string;
}) => {
  const res = await api.get('/admin/users/export/csv', {
    responseType: 'blob',
    params: {
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
};

export const exportUsersExcel = async (params?: {
  start?: string;
  end?: string;
}) => {
  const res = await api.get('/admin/users/export/excel', {
    responseType: 'blob',
    params: {
      start: params?.start,
      end: params?.end,
    },
  });
  return res.data;
};

export const getDepartments = async (): Promise<DepartmentsResponse> => {
  try {
    const { data } = await api.get('/admin/departments');

    return data;
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to fetch departments');
  }
};

export const getPositions = async (): Promise<PositionsResponse> => {
  try {
    const { data } = await api.get('/admin/positions');

    return data;
  } catch (err) {
    throw new Error((err as Error).message || 'Failed to fetch positions');
  }
};

/**
 * Lock or unlock a user account
 */
export async function toggleLockUser(
  userId: string,
  locked: boolean,
  duration?: number,
  lockUntil?: string
) {
  const res = await api.post(`/admin/users/${userId}/lock`, {
    locked,
    duration,
    lockUntil,
  });
  return res.data;
}

export async function adminReset2FA(userId: number) {
  const res = await api.post('/admin/reset-2fa', { userId });
  return res.data;
}
