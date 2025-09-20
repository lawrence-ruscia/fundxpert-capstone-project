import { MAX_REPAYMENT_MONTHS } from '../../config/policy.config.js';

export const validateLoanRequest = (
  consent: boolean,
  amount: number,
  minLoanAmount: number,
  maxLoanAmount: number,
  repaymentTerm: number
) => {
  if (!consent) throw new Error('Consent must be acknowledged');

  if (amount < minLoanAmount)
    throw new Error(`Minimum loan is ${minLoanAmount}`);
  if (amount > maxLoanAmount)
    throw new Error(`Maximum loan allowed is ${maxLoanAmount}`);
  if (repaymentTerm <= 0 || repaymentTerm > MAX_REPAYMENT_MONTHS) {
    throw new Error(
      `Repayment term must be between 1 and ${MAX_REPAYMENT_MONTHS} months`
    );
  }
};
