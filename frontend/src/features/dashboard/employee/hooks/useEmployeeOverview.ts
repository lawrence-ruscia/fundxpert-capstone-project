import { useState, useEffect } from 'react';
import {
  employeeService,
  type EmployeeOverview,
} from '../services/employeeService';

export const useEmployeeOverview = () => {
  const [overview, setOverview] = useState<EmployeeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await employeeService.fetchEmployeeOverview();
        setOverview(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  return { overview, loading, error };
};
