import { useEmployeeContributions } from '../hooks/useEmployeeContributions';
import type { ContributionPeriod } from '../types/employeeContributions';
import { useState } from 'react';

const periods = [
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last 1 Year' },
  { value: 'all', label: 'All Time' },
  { value: 'year', label: 'This Year' },
];

export default function ContributionHistoryPage() {
  const [period, setPeriod] = useState<ContributionPeriod>('year'); // default
  const { data, loading, error } = useEmployeeContributions(period);

  if (loading) return <p>Loading contributions...</p>;
  if (error) return <p style={{ color: 'red' }}>{error.message}</p>;
  if (!data) return <p>No contribution data available.</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>📊 Contribution History</h1>

      <label>
        View Period:{' '}
        <select
          value={period}
          onChange={e => setPeriod(e.target.value as ContributionPeriod)}
        >
          {periods.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <table border={1} cellPadding={6} style={{ marginTop: '1rem' }}>
        <thead>
          <tr>
            <th>Month</th>
            <th>Employee</th>
            <th>Employer</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.contributions.map(c => (
            <tr key={`${c.month}-${c.year}`}>
              <td>{c.month}</td>
              <td>₱{c.employee}</td>
              <td>₱{c.employer}</td>
              <td>₱{c.total}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>
              <strong>Totals</strong>
            </td>
            <td>₱{data.totals.employee}</td>
            <td>₱{data.totals.employer}</td>
            <td>₱{data.totals.grand_total}</td>
          </tr>9
        </tfoot>
      </table>
    </div>
  );
}
