// Utility: get date range from period string

type DateRangeType = {
  startDate?: Date | undefined;
  endDate?: Date | undefined;
};

// Utility: determine vesting eligibility (2 years rule)
export const isContributionVested = (
  contributionDate: Date,
  hireDate: Date
): boolean => {
  const vestingDate = new Date(hireDate);
  vestingDate.setFullYear(vestingDate.getFullYear() + 2);
  return contributionDate >= vestingDate;
};

// Utility: map period -> date range
export const getDateRange = (period: string): DateRangeType => {
  const now = new Date();
  const endDate = now;
  let startDate: Date | undefined;

  switch (period) {
    case '3m':
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      startDate = new Date();
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate = new Date();
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'all':
    default:
      startDate = undefined; // no filter
      break;
  }

  return { startDate, endDate };
};
