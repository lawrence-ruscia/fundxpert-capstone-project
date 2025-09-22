import type { Request, Response } from 'express';
import { isAuthenticatedRequest } from './employeeControllers.js';
import * as withdrawalDocService from '../services/withdrawalDocumentService.js';
import { pool } from '../config/db.config.js';

export async function uploadWithdrawalDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const { withdrawalId } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ error: 'fileUrl is required' });
    }

    // Verify ownership
    const result = await pool.query(
      'SELECT id, user_id, status FROM withdrawal_requests WHERE id=$1',
      [withdrawalId]
    );
    const withdrawal = result.rows[0];
    if (!withdrawal || withdrawal.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to add documents' });
    }
    if (withdrawal.status !== 'Pending') {
      return res
        .status(400)
        .json({ error: 'Cannot add documents once processed' });
    }

    const doc = await withdrawalDocService.addWithdrawalDocument(
      Number(withdrawalId),
      fileUrl,
      fileName,
      userId
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
    const userId = req.user.id;
    const { withdrawalId } = req.params;

    const result = await pool.query(
      'SELECT id, user_id FROM withdrawal_requests WHERE id=$1',
      [withdrawalId]
    );
    const withdrawal = result.rows[0];
    if (!withdrawal || withdrawal.user_id !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to view documents' });
    }

    const docs = await withdrawalDocService.getWithdrawalDocuments(
      Number(withdrawalId)
    );
    res.json({ documents: docs });
  } catch (err) {
    console.error('❌ Error fetching withdrawal documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

export async function deleteWithdrawalDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const { withdrawalId, docId } = req.params;

    if (!withdrawalId || !docId) {
      return res.status(400).json({ error: 'Invalid withdrawalId or docId' });
    }
    const success = await withdrawalDocService.deleteWithdrawalDocument(
      userId,
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
