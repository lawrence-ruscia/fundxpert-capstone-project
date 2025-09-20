import { pool } from '../config/db.config.js';
import {
  LOAN_CAP,
  MAX_REPAYMENT_MONTHS,
  MIN_LOAN_AMOUNT,
} from '../config/policy.config.js';
import type { Loan, LoanEligibility } from '../types/loan.js';
import { validateLoanRequest } from './utils/applyForLoanUtils.js';
import {
  getLoanReason,
  getVestedBalance,
} from './utils/checkLoanEligibilityUtils.js';

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
  const vestedBalance = await getVestedBalance(row, userId);

  // Check active loan
  const activeLoanRes = await pool.query(
    `SELECT 1 FROM loans WHERE user_id = $1 AND status IN ('Pending','Approved','Active') LIMIT 1`,
    [userId]
  );

  const hasActiveLoan = activeLoanRes.rows.length > 0;

  // Business rules
  const maxLoanAmount = Math.floor(vestedBalance * LOAN_CAP);

  const { eligible, reason } = getLoanReason(row, hasActiveLoan);

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
  coMakerId?: string,
  notes?: string
): Promise<Loan> {
  // 1. Check eligibility
  const eligibility = await checkLoanEligibility(userId);
  if (!eligibility.eligible) {
    throw new Error(`Not eligible: ${eligibility.reason}`);
  }

  // 2. Validate request
  validateLoanRequest(
    consent,
    amount,
    eligibility.minLoanAmount,
    eligibility.maxLoanAmount,
    repaymentTerm
  );

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

export async function getLoanDetails(userId: number, loanId: number) {
  const query = `
    SELECT id, amount, status, created_at, purpose, 
            repayment_term_months
    FROM loans 
    WHERE id = $1 AND user_id = $2;
  `;
  const { rows } = await pool.query(query, [loanId, userId]);
  if (rows.length === 0) return null;

  const loan = rows[0];

  // fetch documents
  const docsQuery = `
    SELECT file_url, uploaded_at
    FROM loan_documents
    WHERE loan_id = $1;
  `;
  const { rows: docs } = await pool.query(docsQuery, [loanId]);

  return {
    ...loan,
    documents: docs ?? [],
  };
}
