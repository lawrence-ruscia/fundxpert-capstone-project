import type { Request, Response, NextFunction } from 'express';
import type { User } from '../types/user.js';
import jwt from 'jsonwebtoken';

export type DecodedToken = {
  token: string;
  user: User;
};

export function authMiddleware(requiredRole?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // extract from `Bearer <token>`

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as DecodedToken;

      req.user = decoded.user;
      console.log(decoded);

      if (requiredRole && decoded.user.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
