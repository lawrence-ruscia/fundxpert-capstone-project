import { useEffect, useState } from 'react';
import {
  fetchEmployeeContributions,
  type ContributionResponse,
} from '../services/employeeContributionsService';

export default function ContributionHistoryPage() {
  const [data, setData] = useState<ContributionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadContributions() {
      try {
        const res = await fetchEmployeeContributions();
        setData(res);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    loadContributions();
  }, []);

  if (loading) return <p>Loading contributions...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return <p>No contribution data available.</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>📊 Contribution History ({data.year})</h1>
      <table border={1} cellPadding={6}>
        <thead>
          <tr>
            <th>Month</th>
            <th>Employee</th>
            <th>Employer</th>
            <th>Total</th>
            <th>Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {data.contributions.map(c => (
            <tr key={c.month}>
              <td>{c.month}</td>
              <td>₱{c.employee}</td>
              <td>₱{c.employer}</td>
              <td>₱{c.total}</td>
              <td>₱{c.cumulative}</td>
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
            <td colSpan={2}>₱{data.totals.grand_total}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
