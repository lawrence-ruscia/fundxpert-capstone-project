import { api } from '@/shared/api/api';
import type {
  Contribution,
  ContributionPayload,
  ContributionSummary,
} from '../types/hrContribution';

export const hrContributionsService = {
  async findEmployeeByEmployeeId(employeeId: string) {
    const res = await fetch(`/hr/employees/lookup/${employeeId}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Employee not found');
    return res.json();
  },

  async getEmployeeByContributionId(contributionId: number) {
    const { data } = await api.get(
      `/hr/contributions/${contributionId}/employee`
    );

    return data;
  },

  async searchEmployees(query: string) {
    const data = await api.get(
      `/hr/contributions/employees/search?q=${encodeURIComponent(query)}`
    );

    console.log(data);

    return data;
  },

  async recordContribution(payload: ContributionPayload) {
    const { data } = await api.post('/hr/contributions/', payload);
    return data;
  },

  async updateContribution(id: number, payload: Partial<ContributionPayload>) {
    const { data } = await api.put(`/hr/contributions/${id}`, payload);
    return data;
  },

  async getEmployeeContributions(userId: number) {
    const { data } = await api.get(`/hr/contributions/employee/${userId}`);
    return data;
  },

  async getEmployeeContributionsSummary(
    userId: number
  ): Promise<ContributionSummary> {
    const { data } = await api.get(
      `/hr/contributions/employees/${userId}/summary`
    );
    return data;
  },

  async getAllContributions(params?: {
    userId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Contribution[]> {
    const { data } = await api.get('/hr/contributions', { params });
    return data;
  },

  async getContributionsById(id: number): Promise<Contribution> {
    const { data } = await api.get(`/hr/contributions/lookup/${id}`);
    console.log('Data: ', data);
    return data;
  },

  async exportCSV() {
    const res = await api.get('/hr/contributions/export/csv', {
      responseType: 'blob',
    });
    return res.data;
  },

  async exportExcel() {
    const res = await api.get('/hr/contributions/export/excel', {
      responseType: 'blob',
    });
    return res.data;
  },

  async exportPDF() {
    const res = await api.get('/hr/contributions/export/pdf', {
      responseType: 'blob',
    });
    return res.data;
  },

  async exportEmpContributionPDF(
    id: number,
    params?: { startDate?: string; endDate?: string }
  ) {
    console.log('Start Date: ', params?.startDate);
    const res = await api.get(`/hr/contributions/employees/${id}/export/pdf`, {
      responseType: 'blob',
      params: {
        start: params?.startDate,
        end: params?.endDate,
      },
    });

    return res.data;
  },
};
