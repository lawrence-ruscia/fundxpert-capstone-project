import { api } from '@/shared/api/api';
import type { ProjectionSchema } from '../components/ProjectionParameters';
import type { ProjectionResponse } from '../types/projectionTypes';

export const projectionService = {
  async getProjection(formData: ProjectionSchema): Promise<ProjectionResponse> {
    const res = await api.post('/employee/projection', formData);

    return res.data;
  },
};
