import { pool } from '../config/db.config.js';
import type { LoanDocument } from '../types/loan.js';

/**
 * Add a document to a loan
 */
export async function addLoanDocument(
  loanId: number,
  fileUrl: string,
  fileName: string
): Promise<LoanDocument> {
  const { rows } = await pool.query(
    `INSERT INTO loan_documents (loan_id, file_url, file_name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [loanId, fileUrl, fileName]
  );
  return rows[0];
}

/**
 * Get all documents for a loan
 */
export async function getLoanDocuments(
  loanId: number
): Promise<LoanDocument[]> {
  const { rows } = await pool.query(
    `SELECT * FROM loan_documents WHERE loan_id = $1 ORDER BY uploaded_at ASC`,
    [loanId]
  );
  return rows;
}
