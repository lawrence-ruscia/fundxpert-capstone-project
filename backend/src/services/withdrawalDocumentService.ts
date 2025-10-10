// services/withdrawalDocumentService.ts
import { pool } from '../config/db.config.js';
import { getStoragePathForDeletion } from './utils/deleteLoanDocumentUtils.js';
import { supabase } from '../config/supabaseClient.config.js';
import type { WithdrawalDocument } from '../types/withdrawal.js';

export async function addWithdrawalDocument(
  withdrawalId: number,
  fileUrl: string,
  fileName: string,
  uploadedByRole: 'Employee' | 'HR',
  bucketName: string
): Promise<WithdrawalDocument> {
  const res = await pool.query(
    `INSERT INTO withdrawal_documents (withdrawal_id, file_url, file_name, uploaded_by_role, bucket_name)
     VALUES ($1,$2,$3,$4,$5) RETURNING*`,
    [withdrawalId, fileUrl, fileName, uploadedByRole, bucketName]
  );
  return res.rows[0];
}

export async function getWithdrawalDocumentsGrouped(
  withdrawalId: number
): Promise<{
  employeeDocuments: WithdrawalDocument[];
  hrDocuments: WithdrawalDocument[];
}> {
  const { rows } = await pool.query(
    `SELECT id, withdrawal_id, file_url, file_name, uploaded_at, uploaded_by_role, bucket_name
     FROM withdrawal_documents
     WHERE withdrawal_id=$1 ORDER BY uploaded_at ASC`,
    [withdrawalId]
  );

  const employeeDocuments = rows.filter(
    d =>
      d.uploaded_by_role === 'Employee' ||
      d.bucket_name === 'withdrawal-documents'
  );
  const hrDocuments = rows.filter(
    d =>
      d.uploaded_by_role === 'HR' ||
      d.bucket_name === 'hr-withdrawals-documents'
  );

  return { employeeDocuments, hrDocuments };
}

export async function deleteWithdrawalDocumentWithRole(
  userId: number,
  role: 'Employee' | 'HR',
  withdrawalId: number,
  docId: number
): Promise<boolean> {
  // Fetch withdrawal & document details
  const { rows } = await pool.query(
    `
    SELECT wd.id, wd.file_name, wd.file_url, wd.bucket_name, wd.uploaded_by_role,
           wr.user_id AS requester_id, wr.status, wr.assistant_id, wr.officer_id
    FROM withdrawal_documents wd
    INNER JOIN withdrawal_requests wr ON wr.id = wd.withdrawal_id
    WHERE wd.id = $1 AND wd.withdrawal_id = $2
    `,
    [docId, withdrawalId]
  );

  if (rows.length === 0) return false;

  const doc = rows[0];

  // --- Role-Based Access Rules ---
  if (role === 'Employee') {
    // Employee can delete only their own document before review starts
    if (doc.requester_id !== userId) return false;
    if (doc.status !== 'Pending') return false;
    if (doc.uploaded_by_role !== 'Employee') return false;
  } else if (role === 'HR') {
    // HR Assistant can delete only during pending stage
    if (doc.assistant_id === userId) {
      if (doc.status !== 'Pending') return false;
    }
    // HR Officer can delete during or after review (before processed)
    else if (doc.officer_id === userId) {
      if (!['UnderReviewOfficer', 'Approved'].includes(doc.status))
        return false;
    } else {
      // Not assigned to this withdrawal
      return false;
    }
  } else {
    return false;
  }

  // Determine bucket name
  const bucketName =
    doc.bucket_name ||
    (role === 'HR' ? 'hr-withdrawals-documents' : 'withdrawal-documents');

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
  await pool.query(`DELETE FROM withdrawal_documents WHERE id = $1`, [docId]);

  return true;
}
