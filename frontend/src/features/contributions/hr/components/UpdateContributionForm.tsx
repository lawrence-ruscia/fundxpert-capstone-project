import { useState, useEffect } from 'react';
import { hrContributionsService } from '../services/hrContributionService';
import type { Contribution } from '../types/hrContribution';
import { useParams } from 'react-router-dom';

export default function UpdateContributionForm() {
  const { contributionId } = useParams();
  const [contribution, setContribution] = useState<Contribution | null>(null);
  const [form, setForm] = useState({
    employee_amount: '',
    employer_amount: '',
    notes: '',
  });

  useEffect(() => {
    async function fetchContribution() {
      const all = await hrContributionsService.getAllContributions();
      const found = all.find(c => c.id === contributionId) || null;
      setContribution(found);
      if (found) {
        setForm({
          employee_amount: String(found.employee_amount),
          employer_amount: String(found.employer_amount),
          notes: found.notes || '',
        });
      }
    }
    fetchContribution();
  }, [contributionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribution) return;
    if (!contributionId) return;

    const updated = await hrContributionsService.updateContribution(
      Number(contributionId),
      {
        employee_amount: Number(form.employee_amount),
        employer_amount: Number(form.employer_amount),
        notes: form.notes,
      }
    );

    alert('Contribution updated!');
  };

  if (!contribution) return <p>Loading contribution...</p>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Update Contribution #{contributionId}</h2>
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
      <button type='submit'>Save Changes</button>
    </form>
  );
}
