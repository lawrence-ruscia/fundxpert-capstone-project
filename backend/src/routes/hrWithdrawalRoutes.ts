import { Router } from 'express';
import {
  cancelWithdrawalRequestHandler,
  exportWithdrawalsCSVController,
  exportWithdrawalsExcelController,
  exportWithdrawalsPDFController,
  getAllWithdrawalsHandler,
  getWithdrawalAccessHandler,
  getWithdrawalByIdHandler,
  getWithdrawalHistoryHandler,
  getWithdrawalStatusSummaryHandler,
  markWithdrawalIncompleteHandler,
  markWithdrawalReadyHandler,
  moveWithdrawalToReviewHandler,
  releaseWithdrawalFundsHandler,
  reviewWithdrawalDecisionHandler,
} from '../controllers/hrWithdrawalController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

export const hrWithdrawalRouter = Router();

// hrWithdrawalRouter.use('/files', uploadRouterHR);

/**
 * GET /hr/withdrawals/status-summary
 * Loan Status Summary
 */
hrWithdrawalRouter.get(
  '/status-summary',
  authMiddleware('HR'),
  getWithdrawalStatusSummaryHandler
);

/**
 * STEP 0: HR Assistant / Officer marks application as ready for HR Benfits Officer review
 */

hrWithdrawalRouter.patch(
  '/:withdrawalId/mark-ready',
  authMiddleware('HR'),
  markWithdrawalReadyHandler
);
hrWithdrawalRouter.patch(
  '/:withdrawalId/mark-incomplete',
  authMiddleware('HR'),
  markWithdrawalIncompleteHandler
);

/**
 * STEP 1: HR Benefits Officer Moves the loan into the review process
 */
hrWithdrawalRouter.post(
  '/:withdrawalId/review',
  authMiddleware('HR'),
  moveWithdrawalToReviewHandler
);

/**
 * STEP 3: HR Approvers approve or reject
 * (system validates they are authorized approvers for this loan)
 */
hrWithdrawalRouter.post(
  '/:withdrawalId/approve',
  authMiddleware('HR'),
  reviewWithdrawalDecisionHandler
);

/**
 * STEP 4: HR Officer marks loan as released (Trust Bank)
 */
hrWithdrawalRouter.post(
  '/:withdrawalId/release',
  authMiddleware('HR'),
  releaseWithdrawalFundsHandler
);

/**
 * STEP 5: Cancel loan (either by HR or employee)
 */
hrWithdrawalRouter.post(
  '/:withdrawalId/cancel',
  authMiddleware('HR'),
  cancelWithdrawalRequestHandler
);

/**
 * GET /hr/loans
 * List all loan applications (with filters)
 */
hrWithdrawalRouter.get('/', authMiddleware('HR'), getAllWithdrawalsHandler);

/**
 * GET /hr/loans/:loanId
 * Fetch detailed information for a single loan
 */
hrWithdrawalRouter.get(
  '/:withdrawalId',
  authMiddleware('HR'),
  getWithdrawalByIdHandler
);

/**
 * GET /hr/loans/:loanId/history
 * View all actions taken on this loan
 */
hrWithdrawalRouter.get(
  '/:withdrawalId/history',
  authMiddleware('HR'),
  getWithdrawalHistoryHandler
);

/**
 * GET /hr/loans/:loanId/access
 * View all role-based contextual access
 */
hrWithdrawalRouter.get(
  '/:withdrawalId/access',
  authMiddleware('HR'),
  getWithdrawalAccessHandler
);

/**
 * GET /hr/loans/export/csv
 */
hrWithdrawalRouter.get(
  '/export/csv',
  authMiddleware('HR'),
  exportWithdrawalsCSVController
);

/**
 * GET /hr/loans/export/excel
 */
hrWithdrawalRouter.get(
  '/export/excel',
  authMiddleware('HR'),
  exportWithdrawalsExcelController
);

/**
 * GET /hr/loans/export/pdf
 */
hrWithdrawalRouter.get(
  '/export/pdf',
  authMiddleware('HR'),
  exportWithdrawalsPDFController
);

/** GET /hr/loans/:loanId/documents */
// hrWithdrawalRouter.get(
//   '/:loanId/documents',
//   authMiddleware('HR'),
//   getLoanDocuments
// );

// hrWithdrawalRouter.post(
//   '/:loanId/documents',
//   authMiddleware('HR'),
//   uploadLoanDocument
// );

/** DELETE /hr/loans/:loanId/documents/:docId */
// hrWithdrawalRouter.delete(
//   '/:loanId/documents/:docId',
//   authMiddleware('HR'),
//   deleteLoanDocument
// );
