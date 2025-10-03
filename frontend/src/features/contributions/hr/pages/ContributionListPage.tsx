import type { Contribution } from '../types/hrContribution';
import { hrContributionsService } from '../services/hrContributionService.js';
import { useApi } from '@/shared/hooks/useApi.js';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner.js';
import { DataError } from '@/shared/components/DataError.js';
import { Link, useNavigate } from 'react-router-dom';
import { useContributionsExport } from '../hooks/useContributionsExport.js';
export default function ContributionListPage() {
  const {
    data: contributions,
    loading,
    error,
  } = useApi<Contribution[]>(() =>
    hrContributionsService.getAllContributions()
  );
  const { handleExport } = useContributionsExport();

  const navigate = useNavigate();

  if (loading) return <LoadingSpinner text='Loading contributions...' />;
  if (error) return <DataError message='Unable to fetch contributions' />;

  return (
    <div className='space-y-6'>
      <h1 className='text-xl font-semibold'>Employee Contributions</h1>

      {/* Actions */}
      <div className='flex gap-3'>
        <button onClick={() => handleExport('csv')}>Export CSV</button>
        <button onClick={() => handleExport('xlsx')}>Export Excel</button>
        <button onClick={() => handleExport('pdf')}>Export PDF</button>
        <button onClick={() => navigate('/hr/contributions/new')}>
          + Add Contribution
        </button>
      </div>

      {/* Table */}
      <table className='w-full border'>
        <thead>
          <tr className='bg-gray-100 text-left'>
            <th>ID</th>
            <th>Employee</th>
            <th>Contribution Date</th>
            <th>Employee Amt</th>
            <th>Employer Amt</th>
            <th>Adjusted</th>
            <th>Created By</th>
            <th>Updated By</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {contributions?.map(c => (
            <tr key={c.id} className='border-b hover:bg-gray-50'>
              <td>{c.id}</td>
              <td>
                <Link
                  to={`/hr/employees/${c.user_id}/contributions`}
                  className='text-blue-600 hover:underline'
                >
                  {c.employee_name} ({c.employee_id})
                </Link>
              </td>
              <td>{new Date(c.contribution_date).toLocaleDateString()}</td>
              <td>{c.employee_amount.toFixed(2)}</td>
              <td>{c.employer_amount.toFixed(2)}</td>
              <td>{c.is_adjusted ? '✅' : '—'}</td>
              <td>{c.created_by_name}</td>
              <td>{c.updated_by_name || '—'}</td>
              <td>{c.notes || '—'}</td>
              <td className='flex gap-2'>
                <Link
                  to={`/hr/contributions/${c.id}/edit`}
                  className='text-blue-600 hover:underline'
                >
                  Edit
                </Link>
                <button className='text-red-600 hover:underline'>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
