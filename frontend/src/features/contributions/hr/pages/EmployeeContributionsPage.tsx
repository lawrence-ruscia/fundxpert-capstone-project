import { useEffect, useState } from 'react';
import { hrContributionsService } from '../services/hrContributionService';
import type { Contribution } from '../types/hrContribution';
import { useParams } from 'react-router-dom';

export default function EmployeeContributionsPage() {
  const { id } = useParams();
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const fetch = async () => {
      if (id) {
        const contributions =
          await hrContributionsService.getEmployeeContributions(Number(id));
        setContributions(contributions);
      }
    };
    fetch();
  }, [id]);

  return (
    <div>
      <h1>Employee {id} Contributions</h1>

      <ul>
        {contributions.map(c => (
          <li key={c.id}>
            {c.contribution_date}: ₱{c.employee_amount} / ₱{c.employer_amount}
          </li>
        ))}
      </ul>
    </div>
  );
}
