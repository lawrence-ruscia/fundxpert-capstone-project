import type { UserRequest } from '../middleware/authMiddleware.ts';

declare global {
  namespace Express {
    interface Request {
      user?: UserRequest;
    }
  }
}

export {};
