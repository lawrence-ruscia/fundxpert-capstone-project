import type { Request, Response, NextFunction } from 'express';
import type { Role } from '../types/user.js';
import jwt from 'jsonwebtoken';

export type JWTPayload = {
  id: number;
  name: string;
  role: Role;
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
      ) as JWTPayload;

      req.user = decoded;
      console.log(decoded);

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
}
