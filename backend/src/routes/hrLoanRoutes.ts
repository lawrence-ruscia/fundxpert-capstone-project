import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

import {
  assignLoanApproversHandler,
  cancelLoanRequestHandler,
  getAllLoansHandler,
  getLoanApprovalsHandler,
  getLoanByIdHandler,
  getLoanHistoryHandler,
  moveLoanToReviewHandler,
  releaseLoanToTrustBankHandler,
  reviewLoanApprovalHandler,
} from '../controllers/hrLoanController.js';

export const hrLoanRouter = Router();

/**
 * STEP 1: HR Assistant / Officer marks application as ready for review
 */
hrLoanRouter.post(
  '/:loanId/review',
  authMiddleware('HR'),
  moveLoanToReviewHandler
);

/**
 * STEP 2: HR assigns approvers dynamically
 * (benefits officer sets the sequence of approvers)
 */
hrLoanRouter.post(
  '/:loanId/approvers',
  authMiddleware('HR'),
  assignLoanApproversHandler
);

/**
 * STEP 3: HR Approvers approve or reject
 * (system validates they are authorized approvers for this loan)
 */
hrLoanRouter.post(
  '/:loanId/approve',
  authMiddleware('HR'),
  reviewLoanApprovalHandler
);

/**
 * STEP 4: HR Officer marks loan as released (Trust Bank)
 */
hrLoanRouter.post(
  '/:loanId/release',
  authMiddleware('HR'),
  releaseLoanToTrustBankHandler
);

/**
 * STEP 5: Cancel loan (either by HR or employee)
 */
hrLoanRouter.post(
  '/:loanId/cancel',
  authMiddleware('HR'),
  cancelLoanRequestHandler
);

/**
 * GET /hr/loans
 * List all loan applications (with filters)
 */
hrLoanRouter.get('/', authMiddleware('HR'), getAllLoansHandler);

/**
 * GET /hr/loans/:loanId
 * Fetch detailed information for a single loan
 */
hrLoanRouter.get('/:loanId', authMiddleware('HR'), getLoanByIdHandler);

/**
 * GET /hr/loans/:loanId/approvals
 * View approval flow (who approved, who’s next)
 */
hrLoanRouter.get(
  '/:loanId/approvals',
  authMiddleware('HR'),
  getLoanApprovalsHandler
);

/**
 * GET /hr/loans/:loanId/history
 * View all actions taken on this loan
 */
hrLoanRouter.get(
  '/:loanId/history',
  authMiddleware('HR'),
  getLoanHistoryHandler
);
