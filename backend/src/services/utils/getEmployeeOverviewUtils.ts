export const calculateVesting = (
  date_hired: Date,
  employer_total: number
): { vestedAmount: number; unvestedAmount: number } => {
  const hireDate = new Date(date_hired);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  let vestedAmount = 0;
  let unvestedAmount = employer_total;

  if (hireDate <= twoYearsAgo) {
    vestedAmount = employer_total;
    unvestedAmount = 0;
  }

  return { vestedAmount, unvestedAmount };
};
