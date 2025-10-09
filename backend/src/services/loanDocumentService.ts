import { pool } from '../config/db.config.js';
import { supabase } from '../config/supabaseClient.config.js';
import type { LoanDocument } from '../types/loan.js';
import { getStoragePathForDeletion } from './utils/deleteLoanDocumentUtils.js';

/**
 * Add a document to a loan
 */
export async function addLoanDocument(
  loanId: number,
  fileUrl: string,
  fileName: string,
  uploadedByRole: 'Employee' | 'HR',
  bucketName: string
): Promise<LoanDocument> {
  const { rows } = await pool.query(
    `INSERT INTO loan_documents (loan_id, file_url, file_name, uploaded_by_role, bucket_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [loanId, fileUrl, fileName, uploadedByRole, bucketName]
  );
  return rows[0];
}

/**
 * Get all documents for a loan
 */
export async function getLoanDocumentsGrouped(
  loanId: number
): Promise<{ employeeDocuments: LoanDocument[]; hrDocuments: LoanDocument[] }> {
  const { rows } = await pool.query(
    `
    SELECT id, loan_id, file_url, file_name, uploaded_at, uploaded_by_role, bucket_name
    FROM loan_documents
    WHERE loan_id = $1
    ORDER BY uploaded_at ASC
    `,
    [loanId]
  );

  const employeeDocuments = rows.filter(
    d => d.uploaded_by_role === 'Employee' || d.bucket_name === 'loan-documents'
  );
  const hrDocuments = rows.filter(
    d => d.uploaded_by_role === 'HR' || d.bucket_name === 'hr-loan-documents'
  );

  return { employeeDocuments, hrDocuments };
}

export async function deleteLoanDocumentWithRole(
  userId: number,
  role: 'Employee' | 'HR',
  loanId: number,
  docId: number
) {
  // Fetch loan & document details
  const { rows } = await pool.query(
    `
    SELECT ld.id, ld.file_name, ld.file_url, ld.bucket_name, ld.uploaded_by_role,
           l.user_id AS borrower_id, l.status, l.assistant_id, l.officer_id
    FROM loan_documents ld
    INNER JOIN loans l ON l.id = ld.loan_id
    WHERE ld.id = $1 AND ld.loan_id = $2
    `,
    [docId, loanId]
  );

  if (rows.length === 0) return false;

  const doc = rows[0];

  // --- Role-Based Access Rules ---
  if (role === 'Employee') {
    // Employee can delete only their own document before review starts
    if (doc.borrower_id !== userId) return false;
    if (!['Pending', 'Incomplete'].includes(doc.status)) return false;
    if (doc.uploaded_by_role !== 'Employee') return false;
  } else if (role === 'HR') {
    // HR Assistant can delete only during pre-review
    if (doc.assistant_id === userId) {
      if (!['Pending', 'Incomplete'].includes(doc.status)) return false;
    }
    // HR Officer can delete during or after review (before release)
    else if (doc.officer_id === userId) {
      if (
        !['UnderReviewOfficer', 'AwaitingApprovals', 'Approved'].includes(
          doc.status
        )
      )
        return false;
    } else {
      return false;
    }
  } else {
    return false;
  }

  const bucketName =
    doc.bucket_name || (role === 'HR' ? 'hr-loan-documents' : 'loan-documents');
  const storagePath = getStoragePathForDeletion(doc);

  if (!storagePath) {
    console.error('❌ Cannot determine storage path for deletion');
    return false;
  }

  // --- Delete from Supabase Storage ---
  console.log(`Deleting from ${bucketName}: ${storagePath}`);
  const { error: storageError } = await supabase.storage
    .from(bucketName)
    .remove([storagePath]);

  if (storageError) {
    console.error('❌ Supabase deletion failed:', storageError);
    return false;
  }

  // --- Delete DB record ---
  await pool.query(`DELETE FROM loan_documents WHERE id = $1`, [docId]);
  return true;
}
