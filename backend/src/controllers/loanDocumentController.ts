import type { Request, Response } from 'express';
import * as loanDocumentService from '../services/loanDocumentService.js';
import { pool } from '../config/db.config.js';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { getUserById, logUserAction } from '../services/adminService.js';
import { createNotification } from '../utils/notificationHelper.js';

export const hrRoles = {
  BenefitsAssistant: 'Benefits Assistant',
  BenefitsOfficer: 'Benefits Officer',
  DeptHead: 'Department Head',
  MgmtApprover: 'Management Approver',
  GeneralHR: 'General HR',
};

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

    const checkStatus = await getUserById(req.user.id);

    if (
      ['Terminated', 'Resigned', 'Retired'].includes(
        checkStatus.employment_status
      )
    ) {
      return res.status(403).json({
        error: 'Your account is inactive. Please contact HR for assistance.',
      });
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

    const assistant_id = loan.assistant_id;
    const officer_id = loan.officer_id;

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

      const employee = await getUserById(loan.user_id);

      // Notify assistant
      if (assistant_id) {
        if (loan.status === 'Incomplete') {
          await createNotification(
            assistant_id,
            `Missing Document Uploaded - Loan #${loanId}`,
            `${employee.name}} has uploaded ${fileName}} for their loan application.The application may now be ready for review.`,
            'action_required',
            {
              loanId: loan.id,
              link: `/hr/loans/${loanId}`,
            }
          );
        } else {
          await createNotification(
            assistant_id,
            `New Document Uploaded - Loan #${loanId}`,
            `${employee.name}} has uploaded ${fileName}} for their loan application. Please review the document.`,
            'info',
            {
              loanId: loan.id,
              link: `/hr/loans/${loanId}`,
            }
          );
        }
      }

      if (officer_id) {
        await createNotification(
          officer_id,
          `New Document Uploaded - Loan #${loanId}`,
          `${employee.name}} has uploaded ${fileName}} for their loan application. Please review the document.`,
          'success',
          {
            loanId: loan.id,
            link: `/hr/loans/${loanId}`,
          }
        );
      }
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

    if (uploadedByRole === 'HR') {
      const hr = await getUserById(user.id);
      // Notify HR Benefits Officer
      await createNotification(
        officer_id,
        `Document Uploaded by ${hrRoles[hr.hr_role]} - Loan #${loanId}`,
        `${hr.name}} has uploaded ${fileName}} for the loan application. Please review the document.`,
        'success',

        {
          loanId: loan.id,
          link: `/hr/loans/${loanId}`,
        }
      );
    }

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

    const checkStatus = await getUserById(req.user.id);

    if (
      ['Terminated', 'Resigned', 'Retired'].includes(
        checkStatus.employment_status
      )
    ) {
      return res.status(403).json({
        error: 'Your account is inactive. Please contact HR for assistance.',
      });
    }

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
