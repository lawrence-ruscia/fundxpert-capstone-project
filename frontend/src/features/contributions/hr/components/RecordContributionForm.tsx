import { useState } from 'react';
import { hrContributionsService } from '../services/hrContributionService';

export default function RecordContributionForm() {
  const [form, setForm] = useState({
    user_id: '',
    contribution_date: '',
    employee_amount: '',
    employer_amount: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await hrContributionsService.recordContribution({
      user_id: Number(form.user_id),
      contribution_date: form.contribution_date,
      employee_amount: Number(form.employee_amount),
      employer_amount: Number(form.employer_amount),
      notes: form.notes,
    });
    alert('Contribution recorded!');
  };

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
      <input
        placeholder='User ID'
        value={form.user_id}
        onChange={e => setForm({ ...form, user_id: e.target.value })}
      />
      <input
        type='date'
        value={form.contribution_date}
        onChange={e => setForm({ ...form, contribution_date: e.target.value })}
      />
      <input
        placeholder='Employee Amount'
        value={form.employee_amount}
        onChange={e => setForm({ ...form, employee_amount: e.target.value })}
      />
      <input
        placeholder='Employer Amount'
        value={form.employer_amount}
        onChange={e => setForm({ ...form, employer_amount: e.target.value })}
      />
      <input
        placeholder='Notes'
        value={form.notes}
        onChange={e => setForm({ ...form, notes: e.target.value })}
      />
      <button type='submit'>Save</button>
    </form>
  );
}
