import { pool } from '../config/db.config.js';
import type { WithdrawalStatus } from '../types/withdrawal.js';

/**
 * Step 0: Assistant marks as incomplete / missing requirements
 */
export async function markWithdrawalIncomplete(
  withdrawalId: number,
  assistantId: number,
  remarks?: string
) {
  const { rows } = await pool.query(
    `UPDATE withdrawal_requests
     SET ready_for_review = FALSE,
         assistant_id = $2,
         notes = COALESCE($3, notes),
         updated_at = NOW(),
         status = 'Incomplete'
     WHERE id = $1
       AND status = 'Pending'
     RETURNING *`,
    [withdrawalId, assistantId, remarks || null]
  );
  return rows[0] || null;
}

/**
 * Step 0: Assistant marks ready for review (complete)
 */
export async function markWithdrawalReady(
  withdrawalId: number,
  assistantId: number
) {
  const { rows } = await pool.query(
    `UPDATE withdrawal_requests
     SET ready_for_review = TRUE,
         assistant_id = $2,
         updated_at = NOW(),
         status = 'Pending',
         notes = NULL
     WHERE id = $1
       AND status IN ('Pending', 'Incomplete')
     RETURNING *`,
    [withdrawalId, assistantId]
  );
  return rows[0] || null;
}

/**
 * Step 1: HR Officer begins review
 */
export async function moveWithdrawalToReview(
  withdrawalId: number,
  officerId: number
) {
  const { rows } = await pool.query(
    `SELECT ready_for_review, assistant_id, status 
     FROM withdrawal_requests WHERE id = $1`,
    [withdrawalId]
  );
  const request = rows[0];
  if (!request) throw new Error('Withdrawal request not found');
  if (!request.ready_for_review)
    throw new Error(
      'Withdrawal request must be marked ready for review by an HR assistant first.'
    );
  if (request.status !== 'Pending')
    throw new Error(
      'Withdrawal request must be in Pending state before review.'
    );

  const { rows: updated } = await pool.query(
    `UPDATE withdrawal_requests
     SET status = 'UnderReviewOfficer',
         officer_id = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [withdrawalId, officerId]
  );
  return updated[0] || null;
}

/**
 * Step 2: HR Officer approves
 */
export async function reviewWithdrawalDecision(
  withdrawalId: number,
  officerId: number,
  decision: 'Approved' | 'Rejected',
  comments?: string
) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verify that the officer is the assigned HR officer and request is under review
    const { rows: current } = await client.query(
      `SELECT id, status, officer_id 
       FROM withdrawal_requests 
       WHERE id = $1`,
      [withdrawalId]
    );

    const request = current[0];
    if (!request) throw new Error('Withdrawal request not found.');
    if (request.officer_id !== officerId)
      throw new Error(
        'Only the assigned HR officer can approve or reject this request.'
      );
    if (request.status !== 'UnderReviewOfficer')
      throw new Error('Request must be under review to approve or reject.');

    // 2. Apply officer decision
    await client.query(
      `UPDATE withdrawal_requests
       SET status = $2,
           reviewed_by = $3,
           reviewed_at = NOW(),
           notes = COALESCE($4, notes),
           updated_at = NOW()
       WHERE id = $1`,
      [withdrawalId, decision, officerId, comments || null]
    );

    // 3. Record audit log / history
    await client.query(
      `INSERT INTO withdrawal_history (withdrawal_id, action, performed_by, remarks)
       VALUES ($1, $2, $3, $4)`,
      [
        withdrawalId,
        decision === 'Approved'
          ? 'Approved by HR Officer'
          : 'Rejected by HR Officer',
        officerId,
        comments || null,
      ]
    );

    await client.query('COMMIT');
    return { success: true, decision };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Step 4: HR Officer releases funds (final confirmation)
 */
export async function releaseWithdrawalFunds(
  withdrawalId: number,
  officerId: number,
  paymentReference?: string | null
) {
  const { rows: requestRows } = await pool.query(
    `SELECT officer_id, status FROM withdrawal_requests WHERE id = $1`,
    [withdrawalId]
  );

  const request = requestRows[0];
  if (!request) throw new Error('Loan not found.');
  if (request.officer_id !== officerId)
    throw new Error(
      'Only the HR officer who processed this request can release it.'
    );
  if (request.status !== 'Approved')
    throw new Error(
      'Withdrawal request must be approved before it can be released.'
    );

  const { rows } = await pool.query(
    `UPDATE withdrawal_requests
     SET status = 'Released',
         processed_by = $2,
         processed_at = NOW(),
         payment_reference = $3,
         updated_at = NOW()
     WHERE id = $1 AND status = 'Approved'
     RETURNING *`,
    [withdrawalId, officerId, paymentReference]
  );
  return rows[0] || null;
}

/**
 * Step 5: Cancel withdrawal (by HR or employee)
 */
export async function cancelWithdrawal(
  withdrawalId: number,
  userId: number,
  byRole: 'HR' | 'Employee',
  remarks: string
) {
  const allowedStatuses: WithdrawalStatus[] = [
    'Pending',
    'Incomplete',
    'UnderReviewOfficer',
  ];

  const { rows } = await pool.query(
    `UPDATE withdrawals
     SET status = 'Cancelled', updated_at = NOW(), notes = $5
     WHERE id = $1
       AND status = ANY($2)
       AND ($3 = 'HR' OR user_id = $4)
     RETURNING *`,
    [withdrawalId, allowedStatuses, byRole, userId, remarks]
  );

  return rows[0] || null;
}

/**
 * Record history / audit log
 */
export async function recordWithdrawalHistory(
  withdrawalId: number,
  action: string,
  performedBy: number,
  remarks?: string
) {
  await pool.query(
    `INSERT INTO withdrawal_history (withdrawal_id, action, performed_by, remarks)
     VALUES ($1, $2, $3, $4)`,
    [withdrawalId, action, performedBy, remarks || null]
  );
}

/** Get all withdrawals (with optional filters) */
export async function getAllWithdrawals(filters: {
  status?: string | null;
  search?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}) {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    params.push(filters.status);
    conditions.push(`w.status = $${params.length}`);
  }

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(
      `(u.name ILIKE $${params.length} OR u.employee_id ILIKE $${params.length})`
    );
  }

  if (filters.startDate) {
    params.push(filters.startDate);
    conditions.push(`w.created_at >= $${params.length}`);
  }

  if (filters.endDate) {
    params.push(filters.endDate);
    conditions.push(`w.created_at <= $${params.length}`);
  }

  let query = `
     SELECT
      w.id,
      u.employee_id,
      u.name AS employee_name,
      d.name AS department_name,
      p.title AS position_title,
      w.request_type,
      w.purpose_detail,
      w.payout_amount,
      w.status,
      ua.name AS assistant_name,
      ub.name AS officer_name,
      w.reviewed_at,
      w.created_at,
      w.processed_at,
      w.updated_at
    FROM withdrawal_requests w
    LEFT JOIN users u ON w.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id 
    LEFT JOIN positions p ON u.position_id = p.id 
    LEFT JOIN users ua ON w.assistant_id = ua.id
    LEFT JOIN users ub ON w.officer_id = ub.id
  `;

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` ORDER BY w.created_at DESC`;

  const { rows } = await pool.query(query, params);
  return rows;
}

export async function getWithdrawalById(withdrawalId: number) {
  const query = `
    SELECT w.*, 
           u.name AS employee_name,
           u.employee_id,
           d.name AS department_name,
           p.title AS position_title
    FROM withdrawal_requests w
    JOIN users u ON w.user_id = u.id
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN positions p ON u.position_id = p.id
    WHERE w.id = $1
  `;
  const { rows } = await pool.query(query, [withdrawalId]);
  return rows[0] || null;
}

export async function getWithdrawalHistory(loanId: number) {
  const query = `
    SELECT wh.*, 
           u.name AS actor_name
    FROM withdrawal_history wh
    JOIN users u ON wh.performed_by = u.id
    WHERE wh.withdrawal_id = $1
    ORDER BY wh.created_at ASC;
  `;

  const { rows } = await pool.query(query, [loanId]);
  return rows;
}

/** Handle Assistant vs Officer context detection */
export async function getWithdrawalAccess(
  userId: number,
  withdrawalId: number
) {
  const { rows } = await pool.query(
    `SELECT id, status, officer_id, assistant_id, ready_for_review
     FROM withdrawal_requests WHERE id = $1`,
    [withdrawalId]
  );
  const request = rows[0];
  if (!request) throw new Error('Withdrawal request not found');

  const access = {
    canMarkReady: false,
    canMarkIncomplete: false,
    canMoveToReview: false,
    canApprove: false,
    canReject: false,
    canRelease: false,
    canCancel: false,
  };

  switch (request.status) {
    case 'Pending':
    case 'Incomplete':
      // Assistant pre-screens the request
      if (!request.assistant_id || request.assistant_id === userId) {
        access.canMarkReady = true;
        access.canMarkIncomplete = true;
      }

      // Officer can move to review if ready and not the same as assistant
      if (request.ready_for_review) {
        access.canMarkReady = false;
        access.canMarkIncomplete = false;
      }

      if (request.status === 'Incomplete') {
        access.canMarkIncomplete = false;
      }

      // Officer can move to review, but NOT the same assistant
      if (request.ready_for_review && request.assistant_id !== userId) {
        access.canMoveToReview = true;
      }

      access.canCancel = true;
      break;

    case 'UnderReviewOfficer':
      // Only assigned HR officer can take these actions
      if (request.officer_id === userId) {
        access.canApprove = true;
        access.canReject = true;
        access.canCancel = true;
      }
      break;

    case 'Approved':
      // Only assigned HR officer can release
      if (request.officer_id === userId) {
        access.canRelease = true;
      }
      break;

    case 'Rejected':
    case 'Released':
    case 'Cancelled':
      // All completed states — read-only
      break;
  }

  return access;
}

export async function getWithdrawalStatusSummary(): Promise<
  { status: string; count: number }[]
> {
  const { rows } = await pool.query(`
    SELECT 
      status,
      COUNT(*)::int AS count
    FROM withdrawal_requests
    GROUP BY status
    ORDER BY status;
  `);

  return rows;
}
