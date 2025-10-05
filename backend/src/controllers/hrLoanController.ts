import type { Request, Response } from 'express';
import { isAuthenticatedRequest } from './employeeControllers.js';
import {
  assignLoanApprovers,
  cancelLoanRequest,
  getAllLoans,
  getLoanAccess,
  getLoanApprovals,
  getLoanById,
  getLoanHistory,
  getLoanStatusSummary,
  markLoanIncomplete,
  markLoanReadyForReview,
  moveLoanToReview,
  recordLoanHistory,
  releaseLoanToTrustBank,
  reviewLoanApproval,
} from '../services/hrLoanService.js';

export const markLoanReadyHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { loanId } = req.params;
    const assistantId = req.user.id;

    const access = await getLoanAccess(assistantId, Number(loanId));
    if (!access.canMarkReady) {
      return res.status(403).json({
        error: 'You are not authorized to mark this loan as ready',
      });
    }

    const loan = await markLoanReadyForReview(Number(loanId), assistantId);
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not found or not in Pending state' });

    await recordLoanHistory(loan.id, 'Marked ready for review', assistantId);
    res.json({ success: true, loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark loan as ready' });
  }
};

export const markLoanIncompleteHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { loanId } = req.params;
    const { remarks } = req.body;
    const assistantId = req.user.id;

    const access = await getLoanAccess(assistantId, Number(loanId));
    if (!access.canMarkIncomplete) {
      return res.status(403).json({
        error: 'You are not authorized to mark this loan as incomplete',
      });
    }

    const loan = await markLoanIncomplete(Number(loanId), assistantId, remarks);
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not found or not in Pending state' });

    await recordLoanHistory(
      loan.id,
      'Marked incomplete by HR assistant',
      assistantId,
      remarks
    );
    res.json({ success: true, loan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to mark loan as incomplete' });
  }
};

export const moveLoanToReviewHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { loanId } = req.params;
    const officerId = req.user.id;

    const access = await getLoanAccess(officerId, Number(loanId));
    if (!access.canMoveToReview) {
      return res.status(403).json({
        error: 'You are not authorized to move this loan for officer review',
      });
    }

    const loan = await moveLoanToReview(Number(loanId), officerId);

    if (!loan)
      return res.status(400).json({ error: 'Loan not eligible for review' });

    await recordLoanHistory(Number(loanId), 'Moved to HR review', officerId);
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const assignLoanApproversHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { loanId } = req.params;
    const { approvers } = req.body; // e.g. [{ approverId: 12, sequence: 1 }, { approverId: 15, sequence: 2 }]

    // Check officer access
    const access = await getLoanAccess(userId, Number(loanId));
    if (!access.canAssignApprovers) {
      return res.status(403).json({
        error: 'You are not authorized to assign approvers for this loan',
      });
    }

    // Prevent self-inclusion as approver
    const selfIncluded = approvers.some(
      (a: { approverId: number; sequence: number }) => a.approverId === userId
    );

    if (selfIncluded) {
      return res.status(400).json({
        error:
          'You cannot assign yourself as an approver. Approvers must be other HR officers.',
      });
    }
    // Prevent duplicate approvers
    const approverIds = approvers.map(
      (a: { approverId: number; sequence: number }) => a.approverId
    );
    const hasDuplicates = new Set(approverIds).size !== approverIds.length;
    if (hasDuplicates) {
      return res.status(400).json({
        error: 'Duplicate approvers detected. Each approver must be unique.',
      });
    }

    //  Require at least 2 approvers (per loan policy)
    if (approvers.length < 2) {
      return res.status(400).json({
        error:
          'At least two approvers are required for Provident Fund loans per policy.',
      });
    }

    const result = await assignLoanApprovers(Number(loanId), userId, approvers);

    await recordLoanHistory(Number(loanId), 'Approvers assigned', req.user.id);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({
        error: err?.message ?? 'Failed to assign approvers',
      });
    }
  }
};

export const reviewLoanApprovalHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const approverId = req.user.id;
    const { decision, comments } = req.body; // 'Approved' | 'Rejected'

    const access = await getLoanAccess(approverId, Number(loanId));
    if (!access.canApprove) {
      return res.status(403).json({
        error: 'You are not authorized to approve this loan',
      });
    }

    const approval = await reviewLoanApproval(
      Number(loanId),
      approverId,
      decision,
      comments
    );

    if (!approval)
      return res.status(403).json({ error: 'Not authorized or invalid stage' });

    await recordLoanHistory(
      Number(loanId),
      `Decision: ${decision}`,
      approverId,
      comments
    );
    res.json({ success: true, approval });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const releaseLoanToTrustBankHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const { txRef } = req.body;
    const releasedBy = req.user.id;

    const access = await getLoanAccess(releasedBy, Number(loanId));
    if (!access.canRelease) {
      return res.status(403).json({
        error: 'You are not authorized to release this loan',
      });
    }

    const loan = await releaseLoanToTrustBank(
      Number(loanId),
      txRef,
      releasedBy
    );
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not approved or already released' });

    await recordLoanHistory(
      Number(loanId),
      'Loan released to Trust Bank',
      releasedBy,
      txRef
    );
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const cancelLoanRequestHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { loanId } = req.params;
    const userId = req.user.id;

    const loan = await cancelLoanRequest(Number(loanId), userId, 'HR');
    if (!loan)
      return res
        .status(400)
        .json({ error: 'Loan not eligible for cancellation' });

    await recordLoanHistory(Number(loanId), 'Loan cancelled by HR', userId);
    res.json({ success: true, loan });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getAllLoansHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, search, startDate, endDate } = req.query;

    const filters = {
      status: status ? String(status) : null,
      search: search ? String(search) : null,
      startDate: startDate ? String(startDate) : null,
      endDate: endDate ? String(endDate) : null,
    };

    const loans = await getAllLoans(filters);

    res.json(loans);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanByIdHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const loan = await getLoanById(Number(loanId));

    if (!loan) return res.status(404).json({ error: 'Loan not found' });
    res.json(loan);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanApprovalsHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const approvals = await getLoanApprovals(Number(loanId));

    res.json(approvals);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanHistoryHandler = async (req: Request, res: Response) => {
  try {
    const { loanId } = req.params;
    const history = await getLoanHistory(Number(loanId));

    res.json(history);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
    }
  }
};

export const getLoanAccessHandler = async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { loanId } = req.params;
    const access = await getLoanAccess(req.user.id, Number(loanId));

    res.json({ userId: req.user.id, access });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch access permissions' });
  }
};

export const getLoanStatusSummaryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await getLoanStatusSummary();
    return res.json({ summary });
  } catch (err) {
    console.error('Failed to fetch loan status summary:', err);
    res.status(500).json({ error: 'Failed to fetch loan status summary' });
  }
};
