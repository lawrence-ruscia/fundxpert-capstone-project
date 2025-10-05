import { pool } from '../config/db.config.js';
import type { LoanApprovalStatus } from '../types/loan.js';

/**
 * Step 0: Assistant marks loan as ready for HR Officer review
 */
export async function markLoanReadyForReview(
  loanId: number,
  assistantId: number
) {
  const { rows } = await pool.query(
    `UPDATE loans
     SET ready_for_review = TRUE,
         assistant_id = $2,
         updated_at = NOW()
     WHERE id = $1
       AND status = 'Pending'
     RETURNING *`,
    [loanId, assistantId]
  );
  return rows[0] || null;
}

/**
 * Step 0: Assistant marks loan as incomplete / needs correction
 */
export async function markLoanIncomplete(
  loanId: number,
  assistantId: number,
  remarks?: string
) {
  const { rows } = await pool.query(
    `UPDATE loans
     SET ready_for_review = FALSE,
         assistant_id = $2,
         notes = COALESCE($3, notes),
         updated_at = NOW()
     WHERE id = $1
       AND status = 'Pending'
     RETURNING *`,
    [loanId, assistantId, remarks || null]
  );
  return rows[0] || null;
}

/**
 * Step 1: HR Officer moves loan into review stage
 */
export async function moveLoanToReview(loanId: number, officerId: number) {
  const { rows } = await pool.query(
    `SELECT ready_for_review, assistant_id, status 
     FROM loans WHERE id = $1`,
    [loanId]
  );
  const loan = rows[0];
  if (!loan) throw new Error('Loan not found');
  if (!loan.ready_for_review)
    throw new Error(
      'Loan must be marked ready for review by an HR assistant first.'
    );
  if (loan.status !== 'Pending')
    throw new Error('Loan must be in Pending state before review.');

  const { rows: updated } = await pool.query(
    `UPDATE loans
     SET status = 'UnderReviewOfficer',
         officer_id = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [loanId, officerId]
  );
  return updated[0] || null;
}

/**
 * Step 2: Assign approvers dynamically (sequence order defines flow)
 * Only the HR officer who moved the loan to review can perform this action.
 */
export async function assignLoanApprovers(
  loanId: number,
  officerId: number,
  approvers: { approverId: number; sequence: number }[]
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Validate ownership — must match the officer who moved to review
    const { rows: loanRows } = await client.query(
      `SELECT officer_id, status FROM loans WHERE id = $1`,
      [loanId]
    );

    const loan = loanRows[0];
    if (!loan) throw new Error('Loan not found.');
    if (loan.officer_id !== officerId)
      throw new Error('Only the assigned HR officer can assign approvers.');
    if (loan.status !== 'UnderReviewOfficer')
      throw new Error('Loan is not in review stage.');

    // At least two approvers
    if (approvers.length < 2)
      throw new Error('At least two approvers are required for this loan.');

    // Prevent officer from assigning themselves
    if (approvers.some(a => a.approverId === officerId)) {
      throw new Error(
        'The HR officer cannot assign themselves as an approver.'
      );
    }

    //  Prevent duplicate approvers
    const approverIds = approvers.map(a => a.approverId);
    const uniqueIds = new Set(approverIds);
    if (uniqueIds.size !== approverIds.length) {
      throw new Error('Duplicate approvers are not allowed.');
    }

    // Remove existing approvers if reassigning
    await client.query(`DELETE FROM loan_approvals WHERE loan_id = $1`, [
      loanId,
    ]);

    // Insert new approvers with correct sequence
    for (const { approverId, sequence } of approvers) {
      const isFirst = sequence === Math.min(...approvers.map(a => a.sequence));
      await client.query(
        `INSERT INTO loan_approvals (loan_id, approver_id, sequence_order, is_current)
         VALUES ($1, $2, $3, $4)`,
        [loanId, approverId, sequence, isFirst]
      );
    }

    // Move loan to awaiting approvals
    await client.query(
      `UPDATE loans
       SET status = 'AwaitingApprovals', updated_at = NOW()
       WHERE id = $1`,
      [loanId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Step 3: Approver reviews loan
 */
export async function reviewLoanApproval(
  loanId: number,
  approverId: number,
  decision: LoanApprovalStatus,
  comments?: string
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1️. Verify approver is the current one
    const { rows: current } = await client.query(
      `SELECT id, sequence_order FROM loan_approvals
       WHERE loan_id = $1 AND approver_id = $2 AND is_current = TRUE`,
      [loanId, approverId]
    );

    if (current.length === 0) {
      throw new Error('You cannot approve yet. It is not your turn.');
    }

    const currentSeq = current[0].sequence_order;

    // 2️. Approver acts
    await client.query(
      `UPDATE loan_approvals
       SET status = $3,
           reviewed_at = NOW(),
           comments = $4,
           is_current = FALSE
       WHERE loan_id = $1 AND approver_id = $2`,
      [loanId, approverId, decision, comments || null]
    );

    // 3️. If rejected → end immediately
    if (decision === 'Rejected') {
      await client.query(
        `UPDATE loans SET status = 'Rejected', updated_at = NOW() WHERE id = $1`,
        [loanId]
      );
      await client.query('COMMIT');
      return { decision };
    }

    // 4️. Find next approver in sequence
    const { rows: next } = await client.query(
      `SELECT approver_id FROM loan_approvals
       WHERE loan_id = $1 AND sequence_order > $2
       ORDER BY sequence_order ASC
       LIMIT 1`,
      [loanId, currentSeq]
    );

    if (next.length > 0) {
      // Set next approver as current
      await client.query(
        `UPDATE loan_approvals
         SET is_current = TRUE
         WHERE loan_id = $1 AND approver_id = $2`,
        [loanId, next[0].approver_id]
      );

      await client.query(
        `UPDATE loans
         SET status = 'AwaitingApprovals', updated_at = NOW()
         WHERE id = $1`,
        [loanId]
      );
    } else {
      // No next approver → all approved
      await client.query(
        `UPDATE loans
         SET status = 'Approved', updated_at = NOW()
         WHERE id = $1`,
        [loanId]
      );
    }

    await client.query('COMMIT');
    return { decision };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Step 4: Mark loan as released (Trust Bank confirmation)
 * Only the HR officer who created the approval flow can release it.
 */
export async function releaseLoanToTrustBank(
  loanId: number,
  txRef: string,
  releasedBy: number
) {
  const { rows: loanRows } = await pool.query(
    `SELECT officer_id, status FROM loans WHERE id = $1`,
    [loanId]
  );

  const loan = loanRows[0];
  if (!loan) throw new Error('Loan not found.');
  if (loan.officer_id !== releasedBy)
    throw new Error(
      'Only the HR officer who processed this loan can release it.'
    );
  if (loan.status !== 'Approved')
    throw new Error('Loan must be approved before it can be released.');

  // Proceed to mark as released
  const { rows } = await pool.query(
    `UPDATE loans
     SET status = 'Active',
         trust_bank_confirmed = true,
         trust_bank_ref = $2,
         approved_by = $3,
         active_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [loanId, txRef, releasedBy]
  );

  return rows[0] || null;
}

/**
 * Step 5: Cancel loan (employee or HR before processing)
 */
export async function cancelLoanRequest(
  loanId: number,
  userId: number,
  byRole: 'Employee' | 'HR'
) {
  const allowedStatuses = [
    'Pending',
    'UnderReviewOfficer',
    'AwaitingApprovals',
  ];
  const { rows } = await pool.query(
    `UPDATE loans
     SET status = 'Cancelled', updated_at = NOW()
     WHERE id = $1 
       AND status = ANY($2)
       AND ($3 = 'HR' OR user_id = $4) -- HR can cancel, employee only their own
     RETURNING *`,
    [loanId, allowedStatuses, byRole, userId]
  );

  return rows[0] || null;
}

/**
 * Step 6: Record history/audit log
 */
export async function recordLoanHistory(
  loanId: number,
  action: string,
  performedBy: number,
  remarks?: string
) {
  await pool.query(
    `INSERT INTO loan_history (loan_id, action, performed_by, remarks)
     VALUES ($1,$2,$3,$4)`,
    [loanId, action, performedBy, remarks || null]
  );
}

/** Get all loans (with optional filters) */
export async function getAllLoans(filters: {
  status?: string | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`l.status = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(u.name ILIKE $${params.length} OR u.employee_id ILIKE $${params.length})`
    );
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`l.created_at >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`l.created_at <= $${params.length}`);
  }

  let query = `
     SELECT
      l.id,
      u.employee_id,
      u.name AS employee_name,
      d.name AS department_name, -- Added department name to the selection
      l.purpose_category,
      l.purpose_detail,
      l.amount,
      l.repayment_term_months,
      l.monthly_amortization,
      l.co_maker_employee_id,
      l.status,
      ua.name AS assistant_name,
      ub.name AS officer_name,
      l.approved_at,
      l.trust_bank_ref,
      l.trust_bank_confirmed,
      l.created_at,
      l.updated_at
    FROM loans l
    LEFT JOIN users u ON l.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id 
    LEFT JOIN users ua ON l.assistant_id = ua.id
    LEFT JOIN users ub ON l.officer_id = ub.id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY l.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
}

/** Get detailed info for a specific loan */
export async function getLoanById(loanId: number) {
  const query = `
    SELECT l.*, 
           u.name AS employee_name,
           u.employee_id,
           d.name AS department_name,
           p.title AS position_title
    FROM loans l
    JOIN users u ON l.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE l.id = $1
  `;
  const { rows } = await pool.query(query, [loanId]);
  return rows[0] || null;
}

/** Get the approval flow for a loan */
export async function getLoanApprovals(loanId: number) {
  const query = `
    SELECT la.*, 
           u.name AS approver_name,
           u.email AS approver_email
    FROM loan_approvals la
    JOIN users u ON la.approver_id = u.id
    WHERE la.loan_id = $1
    ORDER BY la.sequence_order ASC;
  `;
  const { rows } = await pool.query(query, [loanId]);
  return rows;
}

/** Get all history/audit entries for a loan */
export async function getLoanHistory(loanId: number) {
  const query = `
    SELECT lh.*, 
           u.name AS actor_name
    FROM loan_history lh
    JOIN users u ON lh.performed_by = u.id
    WHERE lh.loan_id = $1
    ORDER BY lh.created_at ASC;
  `;
  const { rows } = await pool.query(query, [loanId]);
  return rows;
}

/** Handle Assistant vs Officer context detection */
export async function getLoanAccess(userId: number, loanId: number) {
  const { rows } = await pool.query(
    `SELECT id, status, officer_id, assistant_id, ready_for_review 
     FROM loans WHERE id = $1`,
    [loanId]
  );
  const loan = rows[0];
  if (!loan) throw new Error('Loan not found');

  const access = {
    canMarkReady: false,
    canMarkIncomplete: false,
    canMoveToReview: false,
    canAssignApprovers: false,
    canApprove: false,
    canRelease: false,
    canCancel: false,
  };

  switch (loan.status) {
    case 'Pending':
      // Assistant actions
      if (!loan.assistant_id || loan.assistant_id === userId) {
        access.canMarkReady = true;
        access.canMarkIncomplete = true;
      }

      // Officer can move to review, but NOT the same assistant
      if (loan.ready_for_review && loan.assistant_id !== userId) {
        access.canMoveToReview = true;
      }

      access.canCancel = true;
      break;

    case 'UnderReviewOfficer':
      if (loan.officer_id === userId) {
        access.canAssignApprovers = true;
        access.canCancel = true;
      }
      break;

    case 'AwaitingApprovals': {
      const { rows: approverRows } = await pool.query(
        `SELECT 1 FROM loan_approvals WHERE loan_id = $1 AND approver_id = $2 AND is_current = TRUE`,
        [loanId, userId]
      );
      if (approverRows.length > 0) access.canApprove = true;
      access.canCancel = true;
      break;
    }

    case 'Approved':
      if (loan.officer_id === userId) access.canRelease = true;
      break;
  }

  return access;
}

export async function getLoanStatusSummary(): Promise<
  { status: string; count: number }[]
> {
  const { rows } = await pool.query(`
    SELECT 
      status,
      COUNT(*)::int AS count
    FROM loans
    GROUP BY status
    ORDER BY status;
  `);

  return rows;
}
