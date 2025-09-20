import type { Request, Response } from 'express';
import * as loanDocumentService from '../services/loanDocumentService.js';
import { pool } from '../config/db.config.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

/**
 * POST /employee/loan/:loanId/documents
 */
export async function uploadLoanDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { loanId } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res.status(400).json({ error: 'fileUrl is required' });
    }

    // Verify ownership (loan must belong to user)
    const loanRes = await pool.query(
      'SELECT id, user_id, status FROM loans WHERE id = $1',
      [loanId]
    );
    const loan = loanRes.rows[0];
    if (!loan || loan.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to add documents' });
    }
    if (loan.status !== 'Pending') {
      return res
        .status(400)
        .json({ error: 'Cannot add documents after loan is processed' });
    }

    const doc = await loanDocumentService.addLoanDocument(
      Number(loanId),
      fileUrl,
      fileName
    );

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('❌ Error uploading loan document:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

/**
 * GET /employee/loan/:loanId/documents
 */
export async function getLoanDocuments(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { loanId } = req.params;

    // Verify ownership
    const loanRes = await pool.query(
      'SELECT id, user_id FROM loans WHERE id = $1',
      [loanId]
    );
    const loan = loanRes.rows[0];
    if (!loan || loan.user_id !== userId) {
      return res
        .status(403)
        .json({ error: 'Not authorized to view documents' });
    }

    const docs = await loanDocumentService.getLoanDocuments(Number(loanId));
    res.json({ documents: docs });
  } catch (err) {
    console.error('❌ Error fetching loan documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
}

export async function deleteLoanDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;
    const { loanId, docId } = req.params;

    // Verify ownership & delete
    const success = await loanDocumentService.deleteLoanDocument(
      userId,
      parseInt(loanId ?? '', 10),
      parseInt(docId ?? '', 10)
    );

    if (!success) {
      return res
        .status(404)
        .json({ error: 'Document not found or not authorized' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}
