import type { ProjectionSchema } from '../pages/FundProjectionPage';
import type { ProjectionResponse } from '../types/projectionTypes';

export const projectionService = {
  async getProjection(formData: ProjectionSchema): Promise<ProjectionResponse> {
    const res = await fetch('http://localhost:3000/employee/projection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
      credentials: 'include',
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || 'Login failed');
    }

    return responseData;
  },
};
