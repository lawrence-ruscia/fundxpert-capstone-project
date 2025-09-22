import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { withdrawalUploadRouter } from './withdrawalUploadRoutes.js';
import {
  deleteWithdrawalDocument,
  getWithdrawalDocuments,
  uploadWithdrawalDocument,
} from '../controllers/withdrawalDocumentController.js';

export const withdrawalDocumentRouter = Router();

// mount file upload
withdrawalDocumentRouter.use(authMiddleware('Employee'));
withdrawalDocumentRouter.use('/files', withdrawalUploadRouter);

// attach file record to withdrawal
withdrawalDocumentRouter.post(
  '/:withdrawalId/documents',
  uploadWithdrawalDocument
);

withdrawalDocumentRouter.get(
  '/:withdrawalId/documents',
  getWithdrawalDocuments
);

withdrawalDocumentRouter.delete(
  '/:withdrawalId/documents/:docId',
  deleteWithdrawalDocument
);
