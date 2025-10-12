import type {
  DepartmentsResponse,
  PositionsResponse,
} from '@/features/employeeManagement/types/employeeTypes';
import { api } from '@/shared/api/api';

export const createUser = async (payload: {
  name: string;
  email: string;
  employee_id: string;
  department_id: number;
  position_id: number;
  salary: number;
  date_hired: string;
  role: string;
  generatedTempPassword: string;
}) => {
  console.log(JSON.stringify(payload));
  const res = await api.post('/admin/users', payload);

  return res.data;
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
