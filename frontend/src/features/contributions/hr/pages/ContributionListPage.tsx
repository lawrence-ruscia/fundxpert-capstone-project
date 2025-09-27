import type { Contribution } from '../types/hrContribution';
import { hrContributionsService } from '../services/hrContributionService.js';
import { useApi } from '@/hooks/useApi';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';
import { Link, useNavigate } from 'react-router-dom';
export default function ContributionListPage() {
  const {
    data: contributions,
    loading,
    error,
  } = useApi<Contribution[]>(() =>
    hrContributionsService.getAllContributions()
  );
  const navigate = useNavigate();

  if (loading) {
    return <LoadingSpinner text={'Loading contributions data...'} />;
  }

  if (error) {
    return <DataError message='Unable to fetch contribution data' />;
  }

  const handleExport = async (type: 'csv' | 'excel' | 'pdf') => {
    let blob;
    if (type === 'csv') blob = await hrContributionsService.exportCSV();
    if (type === 'excel') blob = await hrContributionsService.exportExcel();
    if (type === 'pdf') blob = await hrContributionsService.exportPDF();

    const url = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `contributions.${type}`;
    link.click();
  };

  return (
    <div>
      <h1>HR Contributions</h1>

      <div className='flex gap-5'>
        <button onClick={() => handleExport('csv')}>Export CSV</button>
        <button onClick={() => handleExport('excel')}>Export Excel</button>
        <button onClick={() => handleExport('pdf')}>Export PDF</button>
        <button onClick={() => navigate('/hr/contributions/new')}>
          Create Contribution Record
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User</th>
            <th>Date</th>
            <th>Employee Amt</th>
            <th>Employer Amt</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody className='flex flex-col gap-4'>
          {contributions?.map(c => (
            <tr>
              <Link
                key={c.id}
                to={`/hr/employees/${c.user_id}/contributions`}
                className='flex justify-between gap-5'
              >
                <tr key={c.id} className='flex w-full justify-between border-2'>
                  <td>{c.id}</td>
                  <td>{c.user_id}</td>
                  <td>{new Date(c.contribution_date).toLocaleDateString()}</td>
                  <td>{c.employee_amount.toFixed(2)}</td>
                  <td>{c.employer_amount.toFixed(2)}</td>
                  <td>{c.notes}</td>
                </tr>
              </Link>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
