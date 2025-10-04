import type { Request, Response } from 'express';
import { isAuthenticatedRequest } from './employeeControllers.js';
import {
  assignLoanApprovers,
  cancelLoanRequest,
  getAllLoans,
  getLoanApprovals,
  getLoanById,
  getLoanHistory,
  moveLoanToReview,
  recordLoanHistory,
  releaseLoanToTrustBank,
  reviewLoanApproval,
} from '../services/hrLoanService.js';

export const moveLoanToReviewHandler = async (req: Request, res: Response) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { loanId } = req.params;
    const officerId = req.user.id;
    const loan = await moveLoanToReview(Number(loanId), officerId);
    console.log(loan);
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

    const { loanId } = req.params;
    const { approvers } = req.body; // e.g. [{ approverId: 12, sequence: 1 }, { approverId: 15, sequence: 2 }]

    const result = await assignLoanApprovers(Number(loanId), approvers);

    await recordLoanHistory(Number(loanId), 'Approvers assigned', req.user.id);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({ error: err?.message ?? 'Failed to release loan' });
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
