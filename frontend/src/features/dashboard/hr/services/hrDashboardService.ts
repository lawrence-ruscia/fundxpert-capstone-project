export const fetchHROverview = async () => {
  const res = await fetch('http://localhost:3000/hr/overview', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr overview');
  }

  return res.json();
};

export const fetchContributionTrends = async (period: string = 'all') => {
  const url = new URL('http://localhost:3000/hr/contributions/trends');

  if (period) {
    url.searchParams.set('period', period.toString());
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr contributions trends');
  }

  return res.json();
};

export const fetchLoanSummary = async () => {
  const res = await fetch('http://localhost:3000/hr/loans/summary', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr loans summary');
  }

  return res.json();
};

export const fetchWithdrawalSummary = async () => {
  const res = await fetch('http://localhost:3000/hr/withdrawals/summary', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr withdrawals summary');
  }

  return res.json();
};

export const fetchPendingLoans = async () => {
  const res = await fetch('http://localhost:3000/hr/loans/pending', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr loans pending');
  }

  return res.json();
};

export const fetchPendingWithdrawals = async () => {
  const res = await fetch('http://localhost:3000/hr/withdrawals/pending', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr withdrawals pending');
  }

  return res.json();
};
