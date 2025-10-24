import { pool } from '../config/db.config.js';
import { MIN_WITHDRAWAL_AMOUNT } from '../config/policy.config.js';
import type {
  WithdrawalEligibility,
  WithdrawalRequest,
  WithdrawalDocument,
  WithdrawalType,
} from '../types/withdrawal.js';

// Utility: months between two dates
function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth())
  );
}

// Compute vesting based on policy (2-year cliff)
function computeVesting(
  dateHired: Date,
  employeeTotal: number,
  employerTotal: number,
  employmentStatus: string,
  withdrawalType?: WithdrawalType // optional: used when employee applies
) {
  const tenureMonths = monthsBetween(new Date(dateHired), new Date());

  let vestedEmployer = 0;

  // Standard rule: full vesting after 24 months
  if (tenureMonths >= 24) {
    vestedEmployer = employerTotal;
  }

  // Policy overrides (immediate vesting cases)
  if (
    withdrawalType === 'Retirement' ||
    withdrawalType === 'Disability' ||
    withdrawalType === 'Death' ||
    withdrawalType === 'Redundancy'
  ) {
    vestedEmployer = employerTotal;
  }

  return {
    vestedAmount: employeeTotal + vestedEmployer,
    unvestedAmount:
      employeeTotal + employerTotal - (employeeTotal + vestedEmployer),
  };
}

export async function checkWithdrawalEligibility(
  userId: number,
  withdrawalType?: WithdrawalType
): Promise<WithdrawalEligibility> {
  // 1. Fetch user info
  const userRes = await pool.query(
    'SELECT id, date_hired, employment_status FROM users WHERE id=$1',
    [userId]
  );
  const user = userRes.rows[0];
  if (!user) throw new Error('User not found');

  // 2. Fetch contributions
  const contribRes = await pool.query(
    `SELECT
       COALESCE(SUM(employee_amount),0) AS employee_total,
       COALESCE(SUM(employer_amount),0) AS employer_total
     FROM contributions
     WHERE user_id=$1`,
    [userId]
  );
  const { employee_total, employer_total } = contribRes.rows[0];

  // 3. Check if user has any contributions
  const totalBalance = Number(employee_total) + Number(employer_total);

  if (totalBalance === 0) {
    return {
      eligible: false,
      eligibleTypes: [],
      snapshot: {
        employee_total: 0,
        employer_total: 0,
        vested_amount: 0,
        unvested_amount: 0,
        total_balance: 0,
      },
      reasonIfNotEligible:
        'No contributions available. You must have contributions in your account before requesting a withdrawal.',
    };
  }

  // 4. Compute vesting based on policy rules
  const { vestedAmount, unvestedAmount } = computeVesting(
    user.date_hired,
    Number(employee_total),
    Number(employer_total),
    user.employment_status,
    withdrawalType
  );

  // 5. Check if vested amount meets minimum withdrawal requirement
  if (vestedAmount < MIN_WITHDRAWAL_AMOUNT) {
    return {
      eligible: false,
      eligibleTypes: [],
      snapshot: {
        employee_total: Number(employee_total),
        employer_total: Number(employer_total),
        vested_amount: vestedAmount,
        unvested_amount: unvestedAmount,
        total_balance: totalBalance,
      },
      reasonIfNotEligible: `Insufficient vested balance. Minimum withdrawal amount is ₱${MIN_WITHDRAWAL_AMOUNT.toLocaleString()}, but your vested balance is only ₱${vestedAmount.toLocaleString()}.`,
    };
  }

  // 6. Check if a withdrawal already exists
  const existingWithdrawalRes = await pool.query(
    `SELECT 1 FROM withdrawal_requests
     WHERE user_id = $1
       AND status IN ('Pending', 'Incomplete','UnderReviewOfficer', 'Approved', 'Released')
     LIMIT 1`,
    [userId]
  );

  if (existingWithdrawalRes.rows.length > 0) {
    return {
      eligible: false,
      eligibleTypes: [],
      snapshot: {
        employee_total: Number(employee_total),
        employer_total: Number(employer_total),
        vested_amount: vestedAmount,
        unvested_amount: unvestedAmount,
        total_balance: totalBalance,
      },
      reasonIfNotEligible:
        'You already have a pending or approved withdrawal request.',
    };
  }

  // 7. Determine eligible withdrawal types based on employment status
  const eligibleTypes: WithdrawalType[] = [];

  switch (user.employment_status) {
    case 'Retired':
      eligibleTypes.push('Retirement');
      break;
    case 'Resigned':
      eligibleTypes.push('Resignation');
      break;
    case 'Terminated':
      eligibleTypes.push('Redundancy');
      break;
    case 'Active':
      // Active employees can only withdraw for special cases
      // TODO: might want to add partial withdrawal types here if implemented
      // eligibleTypes.push('Medical Emergency', 'Education', etc.)
      break;
    default:
      break;
  }

  // Special cases available regardless of employment status
  // (These would typically require additional documentation)
  eligibleTypes.push('Disability', 'Death');

  // 8. Final eligibility check
  const snapshot = {
    employee_total: Number(employee_total),
    employer_total: Number(employer_total),
    vested_amount: vestedAmount,
    unvested_amount: unvestedAmount,
    total_balance: totalBalance,
  };

  if (eligibleTypes.length === 0) {
    return {
      eligible: false,
      eligibleTypes: [],
      snapshot,
      reasonIfNotEligible:
        'You are not eligible for withdrawal under your current employment status. Withdrawals are only available upon separation, retirement, or special circumstances.',
    };
  }

  return {
    eligible: true,
    eligibleTypes,
    snapshot,
    reasonIfNotEligible: '',
  };
}

export async function applyWithdrawal(
  userId: number,
  payload: {
    request_type: string;
    consent_acknowledged: boolean;
    purpose_detail?: string;
    payout_method?: string;
    beneficiary_name?: string;
    beneficiary_relationship?: string;
    beneficiary_contact?: string;
  }
): Promise<WithdrawalRequest> {
  const eligibility = await checkWithdrawalEligibility(userId);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reasonIfNotEligible || 'Not eligible');
  }

  const { snapshot } = eligibility;
  let payoutAmount = snapshot.vested_amount;

  // NOTE: Adjust based on request_type
  switch (payload.request_type) {
    case 'Retirement':
    case 'Redundancy':
    case 'Disability':
    case 'Death':
      payoutAmount = snapshot.total_balance;
      break;
    case 'Resignation':
      payoutAmount = snapshot.vested_amount;
      break;
  }

  const insertRes = await pool.query(
    `INSERT INTO withdrawal_requests
   (user_id, request_type, purpose_detail,
    employee_contribution_total, employer_contribution_total,
    vested_amount, unvested_amount, total_balance,
    payout_amount, payout_method, consent_acknowledged,
    beneficiary_name, beneficiary_relationship, beneficiary_contact)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
   RETURNING *`,
    [
      userId,
      payload.request_type,
      payload.purpose_detail || null,
      snapshot.employee_total,
      snapshot.employer_total,
      snapshot.vested_amount,
      snapshot.unvested_amount,
      snapshot.total_balance,
      payoutAmount, // always vested amount snapshot
      payload.payout_method || null,
      payload.consent_acknowledged, // must be true
      payload.beneficiary_name || null,
      payload.beneficiary_relationship || null,
      payload.beneficiary_contact || null,
    ]
  );

  return insertRes.rows[0];
}

export async function getWithdrawalHistory(
  userId: number
): Promise<WithdrawalRequest[]> {
  const res = await pool.query(
    `SELECT * FROM withdrawal_requests
     WHERE user_id=$1
     ORDER BY created_at DESC
   `,
    [userId]
  );
  return res.rows;
}

export async function getWithdrawalDetails(
  userId: number,
  withdrawalId: number
): Promise<WithdrawalRequest & { documents: WithdrawalDocument[] }> {
  const reqRes = await pool.query(
    `SELECT * FROM withdrawal_requests WHERE id=$1 AND user_id=$2`,
    [withdrawalId, userId]
  );
  const request = reqRes.rows[0];
  if (!request) throw new Error('Withdrawal not found');

  const docsRes = await pool.query(
    `SELECT * FROM withdrawal_documents WHERE withdrawal_id=$1`,
    [withdrawalId]
  );

  return { ...request, documents: docsRes.rows };
}

export async function cancelWithdrawal(userId: number, withdrawalId: number) {
  const res = await pool.query(
    `UPDATE withdrawal_requests
     SET status='Cancelled'
     WHERE id=$1 AND user_id=$2 AND status='Pending'
     RETURNING *`,
    [withdrawalId, userId]
  );

  const success = res.rowCount !== null && res.rowCount > 0;

  return { success, request: res.rows[0] };
}
