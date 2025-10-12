import { useEffect, useState } from 'react';
import { getDepartments, getPositions } from '../services/hrService';
import type {
  DepartmentsResponse,
  PositionsResponse,
} from '../types/employeeTypes';

export interface FormFieldsOptionsData {
  departments: DepartmentsResponse | null;
  positions: PositionsResponse | null;
}

export function useEmployeeForm() {
  const [data, setData] = useState<FormFieldsOptionsData>({
    departments: null,
    positions: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAllData() {
      try {
        setLoading(true);
        setError(null);

        const results = await Promise.all([getDepartments(), getPositions()]);

        const [departmentsResult, positionsResult] = results;

        setData({
          departments: departmentsResult,
          positions: positionsResult,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error('Employee form fields data fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAllData();
  }, []);

  const refetch = () => {
    // Reset state and refetch
    setData({
      departments: null,
      positions: null,
    });
  };

  return { data, loading, error, refetch };
}
