import type { JWTPayload } from '../middleware/authMiddleware.ts';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export {};
