import type { Request, Response } from 'express';
import { isAuthenticatedRequest } from './employeeControllers.js';
import * as withdrawalDocService from '../services/withdrawalDocumentService.js';
import { pool } from '../config/db.config.js';
import { deleteWithdrawalDocumentWithRole } from '../services/withdrawalDocumentService.js';

export async function uploadWithdrawalDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    const { withdrawalId } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res
        .status(400)
        .json({ error: 'fileUrl and fileName are required' });
    }

    // Fetch withdrawal details
    const { rows } = await pool.query(
      `SELECT id, user_id, status, assistant_id, officer_id
       FROM withdrawal_requests WHERE id = $1`,
      [withdrawalId]
    );

    const withdrawal = rows[0];
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    let bucketName: string;
    let uploadedByRole: 'Employee' | 'HR' = 'Employee';

    // --- Determine Access Level ---
    if (user.role === 'Employee') {
      // Employee can upload only their own pending withdrawal docs
      if (withdrawal.user_id !== user.id) {
        return res.status(403).json({
          error: 'Not authorized to upload documents for this withdrawal',
        });
      }

      if (
        withdrawal.status !== 'Pending' &&
        withdrawal.status !== 'Incomplete'
      ) {
        return res.status(400).json({
          error: 'Cannot upload documents once withdrawal is under review',
        });
      }

      bucketName = 'withdrawal-documents';
      uploadedByRole = 'Employee';
    } else if (user.role === 'HR') {
      // HR Assistant can upload only if assigned to the withdrawal and status is Pending
      if (withdrawal.assistant_id === user.id) {
        if (withdrawal.status !== 'Pending') {
          return res.status(400).json({
            error: 'HR Assistant can only upload during the pending stage',
          });
        }
      }
      // HR Officer can upload during/after review
      else if (withdrawal.officer_id === user.id) {
        if (
          ![
            'UnderReviewOfficer',
            'Approved',
            'Processed',
            'Rejected',
            'Cancelled',
          ].includes(withdrawal.status)
        ) {
          return res.status(400).json({
            error: 'HR Officer can only upload during or after review',
          });
        }
      } else {
        return res.status(403).json({
          error: 'Not authorized to upload HR documents for this withdrawal',
        });
      }

      bucketName = 'hr-withdrawals-documents';
      uploadedByRole = 'HR';
    } else {
      return res
        .status(403)
        .json({ error: 'Unauthorized role for document upload' });
    }

    // --- Insert record ---
    const doc = await withdrawalDocService.addWithdrawalDocument(
      Number(withdrawalId),
      fileUrl,
      fileName,
      uploadedByRole,
      bucketName
    );

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('❌ Error uploading withdrawal document:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

export async function getWithdrawalDocuments(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    const { withdrawalId } = req.params;

    const withdrawalRes = await pool.query(
      `SELECT id, user_id, assistant_id, officer_id
       FROM withdrawal_requests WHERE id = $1`,
      [withdrawalId]
    );

    const withdrawal = withdrawalRes.rows[0];
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    // --- Access Rules ---
    const isEmployee =
      user.role === 'Employee' && withdrawal.user_id === user.id;
    const isHrViewer = user.role === 'HR';

    if (!isEmployee && !isHrViewer) {
      return res
        .status(403)
        .json({ error: 'Access denied to withdrawal documents' });
    }

    // --- Fetch docs grouped by uploader role ---
    const docs = await withdrawalDocService.getWithdrawalDocumentsGrouped(
      Number(withdrawalId)
    );

    res.json(docs);
  } catch (err) {
    console.error('❌ Error fetching withdrawal documents:', err);
    res.status(500).json({ error: 'Failed to fetch withdrawal documents' });
  }
}

export async function deleteWithdrawalDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = req.user;
    const { withdrawalId, docId } = req.params;

    if (!withdrawalId || !docId) {
      return res.status(400).json({ error: 'Invalid withdrawalId or docId' });
    }
    const success = await deleteWithdrawalDocumentWithRole(
      user.id,
      user.role as 'Employee' | 'HR',
      parseInt(withdrawalId, 10),
      parseInt(docId, 10)
    );

    if (!success) {
      return res
        .status(404)
        .json({ error: 'Document not found or not authorized' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting withdrawal document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}
