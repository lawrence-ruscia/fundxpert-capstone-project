import { useEffect, useState } from 'react';
import { hrContributionsService } from '../services/hrContributionService';
import type { Contribution } from '../types/hrContribution';
import { useParams } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { DataError } from '@/shared/components/DataError';

export default function EmployeeContributionsPage() {
  const { id } = useParams();
  const {
    data: contributions,
    loading,
    error,
  } = useApi<Contribution>(
    () => hrContributionsService.getEmployeeContributions(Number(id)),
    [id]
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <DataError message={error.message} />;
  }

  return (
    <div>
      <h1>Employee {id} Contributions</h1>
      <ul>
        {contributions?.map(c => (
          <li key={c.id}>
            {c.contribution_date}: ₱{c.employee_amount} / ₱{c.employer_amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
