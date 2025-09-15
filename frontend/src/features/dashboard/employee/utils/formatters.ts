export function formatCurrency(value: number): string {
  return `₱${value.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Year-over-Year growth formatting
export function formatGrowth(growth: number): string | null {
  if (growth <= 0) return null;

  const prefix = growth >= 0 ? '+' : '';
  return `${prefix}${growth.toFixed(1)}% vs last year`;
}

export function formatVesting(percent: number): string {
  if (percent <= 0) return '0% vested';
  return `${percent.toFixed(1)}% vested`;
}

// Unvested vesting date formatting
export function formatVestingDate(dateHired: string, unvested: number): string {
  if (unvested <= 0) {
    return 'Fully vested';
  }
  const hired = new Date(dateHired);
  const vestDate = new Date(hired);
  vestDate.setFullYear(hired.getFullYear() + 2);

  return `Will vest on ${vestDate.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;
}
