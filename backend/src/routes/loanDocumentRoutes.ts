import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  uploadLoanDocument,
  getLoanDocuments,
} from '../controllers/loanDocumentController.js';
import { uploadRouter } from './uploadRoutes.js';

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
