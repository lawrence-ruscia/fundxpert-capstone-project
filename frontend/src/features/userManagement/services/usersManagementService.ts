import { api } from '@/shared/api/api';

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
