export const periodOptions = [
  {
    value: 'all',
    label: 'All Time',
    description: 'Complete contribution history since enrollment',
  },
  {
    value: 'year',
    label: 'Current Year',
    description: `Year-to-date contributions for ${new Date(Date.now()).getFullYear()}`,
  },
  {
    value: '1y',
    label: 'Last Year',
    description: 'Previous 12 months of contribution data',
  },
  {
    value: '6m',
    label: 'Last 6 Months',
    description: 'Semi-annual view of your contributions',
  },
  {
    value: '3m',
    label: 'Last 3 Months',
    description: 'Recent contributions from the past 90 days',
  },
] as const;
