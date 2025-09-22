import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  uploadLoanDocument,
  getLoanDocuments,
  deleteLoanDocument,
} from '../controllers/loanDocumentController.js';
import { uploadRouter } from './loanUploadRoutes.js';

export const loanDocumentRouter = Router();

loanDocumentRouter.use('/files', uploadRouter);

loanDocumentRouter.post(
  '/:loanId/documents',
  authMiddleware('Employee'),
  uploadLoanDocument
);

loanDocumentRouter.get(
  '/:loanId/documents',
  authMiddleware('Employee'),
  getLoanDocuments
);

loanDocumentRouter.delete(
  '/:loanId/documents/:docId',
  authMiddleware('Employee'),
  deleteLoanDocument
);
