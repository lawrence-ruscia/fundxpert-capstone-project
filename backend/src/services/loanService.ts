import { pool } from '../config/db.config.js';
import {
  LOAN_CAP,
  MAX_REPAYMENT_MONTHS,
  MIN_LOAN_AMOUNT,
} from '../config/policy.config.js';
import type { Loan, LoanEligibility } from '../types/loan.js';

export async function checkLoanEligibility(
  userId: number
): Promise<LoanEligibility> {
  // Fetch vested balance
  const vestedQuery = `
    SELECT 
      COALESCE(SUM(employee_amount + employer_amount), 0) AS total,
      u.date_hired,
      u.employment_status
    FROM contributions c
    RIGHT JOIN users u ON u.id = $1
    WHERE c.user_id = $1
    GROUP BY u.date_hired, u.employment_status;
  `;
  const { rows } = await pool.query(vestedQuery, [userId]);
  const row = rows[0];
  if (!row) throw new Error('User not found');

  // Apply vesting cliff (2 years for employer share)
  const hireDate = new Date(row.date_hired);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  let vestedBalance = Number(row.total);
  if (hireDate > twoYearsAgo) {
    // Not vested in employer contributions
    const empQuery = `
      SELECT COALESCE(SUM(employee_amount), 0) AS employee_only
      FROM contributions
      WHERE user_id = $1
    `;
    const { rows: empRows } = await pool.query(empQuery, [userId]);
    vestedBalance = Number(empRows[0].employee_only);
  }

  // Check active loan
  const activeLoanRes = await pool.query(
    `SELECT 1 FROM loans WHERE user_id = $1 AND status IN ('Pending','Approved','Active') LIMIT 1`,
    [userId]
  );
  const hasActiveLoan = activeLoanRes.rows.length > 0;

  // Business rules
  const maxLoanAmount = Math.floor(vestedBalance * LOAN_CAP);
  let eligible = true;
  let reason: string | null = null;

  if (row.employment_status !== 'Active') {
    eligible = false;
    reason = 'Employment status not Active';
  } else if (vestedBalance <= 0) {
    eligible = false;
    reason = 'No vested balance';
  } else if (hasActiveLoan) {
    eligible = false;
    reason = 'Existing active loan';
  }

  return {
    eligible,
    reason,
    vestedBalance,
    maxLoanAmount,
    hasActiveLoan,
    minLoanAmount: MIN_LOAN_AMOUNT,
    maxRepaymentMonths: MAX_REPAYMENT_MONTHS,
  };
}

/**
 * Apply for a loan
 */
export async function applyForLoan(
  userId: number,
  amount: number,
  repaymentTerm: number,
  purpose: string,
  consent: boolean,
  coMakerId?: number,
  notes?: string
): Promise<Loan> {
  // 1. Check eligibility
  const eligibility = await checkLoanEligibility(userId);
  if (!eligibility.eligible) {
    throw new Error(`Not eligible: ${eligibility.reason}`);
  }

  // 2. Validate request
  if (!consent) throw new Error('Consent must be acknowledged');
  if (amount < eligibility.minLoanAmount)
    throw new Error(`Minimum loan is ${eligibility.minLoanAmount}`);
  if (amount > eligibility.maxLoanAmount)
    throw new Error(`Maximum loan allowed is ${eligibility.maxLoanAmount}`);
  if (repaymentTerm <= 0 || repaymentTerm > MAX_REPAYMENT_MONTHS) {
    throw new Error(
      `Repayment term must be between 1 and ${MAX_REPAYMENT_MONTHS} months`
    );
  }

  // 3. Calculate amortization
  const monthlyAmortization = Math.ceil(amount / repaymentTerm);

  // 4. Insert loan
  const insertQuery = `
    INSERT INTO loans 
    (user_id, amount, repayment_term_months, purpose, co_maker_employee_id,
     consent_acknowledged, notes, status, monthly_amortization)
    VALUES ($1,$2,$3,$4,$5,$6,$7,'Pending',$8)
    RETURNING *;
  `;
  const { rows } = await pool.query(insertQuery, [
    userId,
    amount,
    repaymentTerm,
    purpose,
    coMakerId || null,
    consent,
    notes || null,
    monthlyAmortization,
  ]);

  return rows[0];
}

/**
 * Get active loan (if any)
 */
export async function getActiveLoan(userId: number): Promise<Loan | null> {
  const { rows } = await pool.query(
    `SELECT * FROM loans WHERE user_id = $1 AND status IN ('Pending','Approved','Active') ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Get loan history
 */
export async function getLoanHistory(userId: number): Promise<Loan[]> {
  const { rows } = await pool.query(
    `SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}
