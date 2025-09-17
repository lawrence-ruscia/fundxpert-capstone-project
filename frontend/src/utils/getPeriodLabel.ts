// Calculate exact date range
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth(); // 0-based

export const getPeriodLabel = (period: string): string => {
  switch (period) {
    case '3m': {
      const startMonth = new Date(now.getFullYear(), currentMonth - 2, 1);
      const endMonth = new Date(now.getFullYear(), currentMonth, 1);
      return `${startMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    case '6m': {
      const startMonth = new Date(now.getFullYear(), currentMonth - 5, 1);
      const endMonth = new Date(now.getFullYear(), currentMonth, 1);
      return `${startMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    case '1y': {
      const startMonth = new Date(now.getFullYear(), currentMonth - 11, 1);
      const endMonth = new Date(now.getFullYear(), currentMonth, 1);
      return `${startMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${endMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
    }
    case 'year':
      return `Current Year (${currentYear.toString()})`;
    case 'all':
      return 'All Time';
    default:
      return period;
  }
};
