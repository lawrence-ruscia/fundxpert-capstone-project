import type { Request, Response } from 'express';
import {
  cancelWithdrawal,
  getAllWithdrawals,
  getWithdrawalAccess,
  getWithdrawalById,
  getWithdrawalHistory,
  getWithdrawalStatusSummary,
  markWithdrawalIncomplete,
  markWithdrawalReady,
  moveWithdrawalToReview,
  recordWithdrawalHistory,
  releaseWithdrawalFunds,
  reviewWithdrawalDecision,
} from '../services/hrWithdrawalService.js';
import { isAuthenticatedRequest } from './employeeControllers.js';

export const markWithdrawalReadyHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { loanId: withdrawalId } = req.params;
    const assistantId = req.user.id;

    const access = await getWithdrawalAccess(assistantId, Number(withdrawalId));
    if (!access.canMarkReady) {
      return res.status(403).json({
        error:
          'You are not authorized to mark this withdrawal request as ready',
      });
    }

    const request = await markWithdrawalReady(
      Number(withdrawalId),
      assistantId
    );
    if (!request)
      return res.status(400).json({
        error: 'Withdrawal request not found or not in Pending state',
      });

    await recordWithdrawalHistory(
      request.id,
      'Marked ready for review',
      assistantId
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'Failed to mark withdrawal request as ready' });
  }
};

export const markWithdrawalIncompleteHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR')
      return res.status(403).json({ error: 'Access denied' });

    const { withdrwalId } = req.params;
    const { remarks } = req.body;
    const assistantId = req.user.id;

    const access = await getWithdrawalAccess(assistantId, Number(withdrwalId));
    if (!access.canMarkIncomplete) {
      return res.status(403).json({
        error:
          'You are not authorized to mark this withdrawal request as incomplete',
      });
    }

    const request = await markWithdrawalIncomplete(
      Number(withdrwalId),
      assistantId,
      remarks
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Loan not found or not in Pending state' });

    await recordWithdrawalHistory(
      request.id,
      'Marked incomplete by HR assistant',
      assistantId,
      remarks
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: 'Failed to mark withdrawal request as incomplete' });
  }
};

export const moveWithdrawalToReviewHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { withdrawalId } = req.params;
    const officerId = req.user.id;

    const access = await getWithdrawalAccess(officerId, Number(withdrawalId));
    if (!access.canMoveToReview) {
      return res.status(403).json({
        error:
          'You are not authorized to move this withdrawal request for officer review',
      });
    }

    const request = await moveWithdrawalToReview(
      Number(withdrawalId),
      officerId
    );

    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal request not eligible for review' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Moved to HR review',
      officerId
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(500).json({
        error: err?.message ?? 'Failed to move withdrawal to review stage',
      });
    }
  }
};

export const reviewWithdrawalDecisionHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalID } = req.params;
    const approverId = req.user.id;
    const { decision, comments } = req.body; // 'Approved' | 'Rejected'

    const access = await getWithdrawalAccess(approverId, Number(withdrawalID));
    if (!access.canApprove) {
      return res.status(403).json({
        error: 'You are not authorized to approve this withdrawal request',
      });
    }

    const approval = await reviewWithdrawalDecision(
      Number(withdrawalID),
      approverId,
      decision,
      comments
    );

    if (!approval)
      return res.status(403).json({ error: 'Not authorized or invalid stage' });

    await recordWithdrawalHistory(
      Number(withdrawalID),
      `Decision: ${decision}`,
      approverId,
      comments
    );
    res.json(approval);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to review withdrawal request' });
    }
  }
};

export const releaseWithdrawalFundsHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalId } = req.params;
    const { payment_reference } = req.body;
    const releasedBy = req.user.id;

    const access = await getWithdrawalAccess(releasedBy, Number(withdrawalId));
    if (!access.canRelease) {
      return res.status(403).json({
        error: 'You are not authorized to release this withdrawal request',
      });
    }

    const request = await releaseWithdrawalFunds(
      Number(withdrawalId),
      releasedBy,
      payment_reference
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal not approved or already released' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Withdrawal funds released',
      releasedBy,
      payment_reference || null
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to release withdrawal funds' });
    }
  }
};

export const cancelWithdrawalRequestHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { withdrawalId } = req.params;
    const userId = req.user.id;
    const { remarks } = req.body;

    const request = await cancelWithdrawal(
      Number(withdrawalId),
      userId,
      'HR',
      remarks
    );
    if (!request)
      return res
        .status(400)
        .json({ error: 'Withdrawal request not eligible for cancellation' });

    await recordWithdrawalHistory(
      Number(withdrawalId),
      'Withdrawal request cancelled by HR',
      userId
    );
    res.json({ success: true, withdrawal: request });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to cancel withdrawal request' });
    }
  }
};

export const getWithdrawalStatusSummaryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await getWithdrawalStatusSummary();
    return res.json({ summary });
  } catch (err) {
    console.error('Failed to fetch withdrawal status summary:', err);
    res
      .status(500)
      .json({ error: 'Failed to fetch withdrawal status summary' });
  }
};

export const getAllWithdrawalsHandler = async (req: Request, res: Response) => {
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

    const loans = await getAllWithdrawals(filters);

    res.json(loans);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawals' });
    }
  }
};

export const getWithdrawalByIdHandler = async (req: Request, res: Response) => {
  try {
    const { withdrawalId } = req.params;
    const request = await getWithdrawalById(Number(withdrawalId));

    if (!request)
      return res.status(404).json({ error: 'Withdrawal request not found' });
    res.json(request);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawal' });
    }
  }
};

export const getWithdrawalHistoryHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { withdrawalId } = req.params;
    const history = await getWithdrawalHistory(Number(withdrawalId));

    res.json(history);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json({ error: err?.message ?? 'Failed to get withdrawal history' });
    }
  }
};

export const getWithdrawalAccessHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user || req.user.role !== 'HR') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { withdrawalId } = req.params;
    const access = await getWithdrawalAccess(req.user.id, Number(withdrawalId));

    res.json({ userId: req.user.id, access });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch access permissions' });
  }
};
