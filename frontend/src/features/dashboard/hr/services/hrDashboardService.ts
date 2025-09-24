export const getOverview = async () => {
  const res = await fetch('http://localhost:3000/hr/overview', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr overview');
  }

  return res.json();
};

export const getContributionTrends = async () => {
  const res = await fetch('http://localhost:3000/hr/contributions/trends', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr contributions trends');
  }

  return res.json();
};

export const getLoanSummary = async () => {
  const res = await fetch('http://localhost:3000/hr/loans/summary', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr loans summary');
  }

  return res.json();
};

export const getWithdrawalSummary = async () => {
  const res = await fetch('http://localhost:3000/hr/withdrawals/summary', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr withdrawals summary');
  }

  return res.json();
};

export const getPendingLoans = async () => {
  const res = await fetch('http://localhost:3000/hr/loans/pending', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr loans pending');
  }

  return res.json();
};

export const getPendingWithdrawals = async () => {
  const res = await fetch('http://localhost:3000/hr/withdrawals/pending', {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch hr withdrawals pending');
  }

  return res.json();
};
