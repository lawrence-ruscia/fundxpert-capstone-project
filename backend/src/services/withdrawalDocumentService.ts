// services/withdrawalDocumentService.ts
import { pool } from '../config/db.config.js';
import { getStoragePathForDeletion } from './utils/deleteLoanDocumentUtils.js';
import { supabase } from '../config/supabaseClient.config.js';

export async function addWithdrawalDocument(
  withdrawalId: number,
  fileUrl: string,
  fileName: string,
  uploadedBy: number
) {
  const res = await pool.query(
    `INSERT INTO withdrawal_documents (withdrawal_id, file_url, file_name, uploaded_by)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [withdrawalId, fileUrl, fileName, uploadedBy]
  );
  return res.rows[0];
}

export async function getWithdrawalDocuments(withdrawalId: number) {
  const res = await pool.query(
    `SELECT id, file_name, file_url, uploaded_at FROM withdrawal_documents
     WHERE withdrawal_id=$1 ORDER BY uploaded_at ASC`,
    [withdrawalId]
  );
  return res.rows;
}

export async function deleteWithdrawalDocument(
  userId: number,
  withdrawalId: number,
  docId: number
): Promise<boolean> {
  // Fetch document info & verify ownership
  const { rows } = await pool.query(
    `
    SELECT wd.id, wd.file_name, wd.file_url
    FROM withdrawal_documents wd
    INNER JOIN withdrawal_requests wr ON wr.id = wd.withdrawal_id
    WHERE wd.id = $1 AND wd.withdrawal_id = $2 AND wr.user_id = $3
    `,
    [docId, withdrawalId, userId]
  );

  if (rows.length === 0) return false;

  const document = rows[0];

  const storagePath = getStoragePathForDeletion(document);
  if (!storagePath) {
    console.error('❌ Cannot determine storage path - aborting deletion');
    return false;
  }

  // Delete from Supabase Storage
  console.log(`Deleting from Supabase Storage: ${storagePath}`);
  const { error: storageError } = await supabase.storage
    .from('withdrawal-documents')
    .remove([storagePath]);

  if (storageError) {
    console.error('❌ Supabase Storage deletion failed:', {
      error: storageError,
      attemptedPath: storagePath,
    });
    return false;
  }

  // Delete from DB
  await pool.query(`DELETE FROM withdrawal_documents WHERE id = $1`, [docId]);

  return true;
}
