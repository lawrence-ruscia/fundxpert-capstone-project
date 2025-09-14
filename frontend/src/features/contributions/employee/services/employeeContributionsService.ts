export type Contribution = {
  month: string;
  employee: number;
  employer: number;
  total: number;
  cumulative: number;
};

export type ContributionResponse = {
  year: number;
  contributions: Contribution[];
  totals: {
    employee: number;
    employer: number;
    grand_total: number;
  };
};

export async function fetchEmployeeContributions(
  year: number = new Date().getFullYear()
): Promise<ContributionResponse> {
  const res = await fetch(
    `http://localhost:3000/employee/contributions?year=${year}`,
    { method: 'GET', credentials: 'include' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch contributions');
  }

  return res.json();
}
