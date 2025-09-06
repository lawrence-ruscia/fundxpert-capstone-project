import type { User } from './user.ts';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
