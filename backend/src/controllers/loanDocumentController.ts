import type { Request, Response } from 'express';
import * as loanDocumentService from '../services/loanDocumentService.js';
import { pool } from '../config/db.config.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

export async function uploadLoanDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    const { loanId } = req.params;
    const { fileUrl, fileName } = req.body;

    if (!fileUrl || !fileName) {
      return res
        .status(400)
        .json({ error: 'fileUrl and fileName are required' });
    }

    // Fetch loan details
    const { rows } = await pool.query(
      `SELECT id, user_id, status, assistant_id, officer_id
       FROM loans WHERE id = $1`,
      [loanId]
    );
    
    const loan = rows[0];
    if (!loan) return res.status(404).json({ error: 'Loan not found' });

    let bucketName: string;
    let uploadedByRole: 'Employee' | 'HR' = 'Employee';

    // --- Determine Access Level ---
    if (user.role === 'Employee') {
      // Employee can upload only their own pending/incomplete loan docs
      if (loan.user_id !== user.id) {
        return res
          .status(403)
          .json({ error: 'Not authorized to upload documents for this loan' });
      }
      if (!['Pending', 'Incomplete'].includes(loan.status)) {
        return res
          .status(400)
          .json({ error: 'Cannot upload after loan is under review' });
      }
      bucketName = 'loan-documents';
      uploadedByRole = 'Employee';
    } else if (user.role === 'HR') {
      // HR Assistant can upload only if assigned to the loan and still pre-review
      if (loan.assistant_id === user.id) {
        if (!['Pending', 'Incomplete'].includes(loan.status)) {
          return res.status(400).json({
            error: 'HR Assistant can only upload during the pre-review stage',
          });
        }
      }
      // HR Officer can upload during/after review
      else if (loan.officer_id === user.id) {
        if (
          ![
            'UnderReviewOfficer',
            'AwaitingApprovals',
            'PendingNextApproval',
            'Approved',
            'Released',
            'Rejected',
            'Cancelled',
          ].includes(loan.status)
        ) {
          return res.status(400).json({
            error: 'HR Officer can only upload during or after review',
          });
        }
      } else {
        return res.status(403).json({
          error: 'Not authorized to upload HR documents for this loan',
        });
      }

      bucketName = 'hr-loan-documents';
      uploadedByRole = 'HR';  
    } else {
      return res
        .status(403)
        .json({ error: 'Unauthorized role for document upload' });
    }

    // --- Insert record ---
    const doc = await loanDocumentService.addLoanDocument(
      Number(loanId),
      fileUrl,
      fileName,
      uploadedByRole, 
      bucketName
    );

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    console.error('❌ Error uploading loan document:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
}

export async function getLoanDocuments(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    const { loanId } = req.params;

    const loanRes = await pool.query(
      `SELECT id, user_id, assistant_id, officer_id 
       FROM loans WHERE id = $1`,
      [loanId]
    );

    const loan = loanRes.rows[0];
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    // --- Access Rules ---
    const isEmployee = user.role === 'Employee' && loan.user_id === user.id;
    const isHrViewer = user.role === 'HR';

    if (!isEmployee && !isHrViewer) {
      return res.status(403).json({ error: 'Access denied to loan documents' });
    }

    // --- Fetch docs grouped by uploader role ---
    const docs = await loanDocumentService.getLoanDocumentsGrouped(
      Number(loanId)
    );

    res.json({
      employeeDocuments: docs.employeeDocuments,
      hrDocuments: docs.hrDocuments,
    });
  } catch (err) {
    console.error('❌ Error fetching loan documents:', err);
    res.status(500).json({ error: 'Failed to fetch loan documents' });
  }
}

export async function deleteLoanDocument(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;
    const { loanId, docId } = req.params;

    const success = await loanDocumentService.deleteLoanDocumentWithRole(
      user.id,
      user.role as 'Employee' | 'HR',
      parseInt(loanId ?? ''),
      parseInt(docId ?? '')
    );

    if (!success) {
      return res
        .status(404)
        .json({ error: 'Document not found or not authorized for deletion' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error deleting document:', err);
    res.status(500).json({ error: 'Failed to delete document' });
  }
}
