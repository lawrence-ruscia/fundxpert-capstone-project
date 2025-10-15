import { api } from '@/shared/api/api';
import type {
  Contribution,
  ContributionPeriod,
  ContributionSummary,
} from '../../shared/types/contributions';

export const fetchEmployeeContributionsSummary = async (
  period?: ContributionPeriod | null
): Promise<ContributionSummary> => {
  const res = await api.get('/employee/contributions/summary');

  console.log(res.data);

  return res.data;
};

export const fetchEmployeeContributions = async (
  period: ContributionPeriod
): Promise<Contribution[]> => {
  const res = await api.get('/employee/contributions', {
    params: {
      period,
    },
  });

  return res.data;
};

export const exportContributionsCSV = async (params?: {
  start?: string;
  end?: string;
}) => {
  const res = await api.get('/employee/contributions/export/csv', {
    responseType: 'blob',
    params: {
      startDate: params?.start,
      endDate: params?.end,
    },
  });
  return res.data;
};

export const exportContributionsExcel = async (params?: {
  start?: string;
  end?: string;
}) => {
  const res = await api.get('/employee/contributions/export/excel', {
    responseType: 'blob',
    params: {
      startDate: params?.start,
      endDate: params?.end,
    },
  });
  return res.data;
};

export const exportContributionsPDF = async (params?: {
  start?: string;
  end?: string;
}) => {
  const res = await api.get('/employee/contributions/export/pdf', {
    responseType: 'blob',
    params: {
      startDate: params?.start,
      endDate: params?.end,
    },
  });
  return res.data;
};
