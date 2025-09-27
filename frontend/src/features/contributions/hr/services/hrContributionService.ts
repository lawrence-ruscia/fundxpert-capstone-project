import { api } from '@/shared/api/api';
import type { ContributionPayload } from '../types/hrContribution';

export const hrContributionsService = {
  async recordContribution(payload: ContributionPayload) {
    const { data } = await api.post('/hr/contributions', payload);
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

  async getAllContributions(params?: { start?: string; end?: string }) {
    const { data } = await api.get('/hr/contributions', { params });
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
};
