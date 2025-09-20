import { pool } from '../config/db.config.js';
import { supabase } from '../config/supabaseClient.config.js';
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

export async function deleteLoanDocument(
  userId: number,
  loanId: number,
  docId: number
) {
  // Fetch document info
  const { rows } = await pool.query(
    `
    SELECT ld.id, ld.file_name, ld.file_url
    FROM loan_documents ld
    INNER JOIN loans l ON l.id = ld.loan_id
    WHERE ld.id = $1 AND ld.loan_id = $2 AND l.user_id = $3
    `,
    [docId, loanId, userId]
  );

  if (rows.length === 0) return false;

  const doc = rows[0];

  // Delete from Supabase
  const filePath = doc.file_url.split('/').pop(); // if stored as full URL
  const { error } = await supabase.storage
    .from('loan-documents')
    .remove([filePath]);

  if (error) {
    console.error('❌ Supabase delete error:', error);
    return false;
  }

  // Delete from DB
  await pool.query(`DELETE FROM loan_documents WHERE id = $1`, [docId]);

  return true;
}
