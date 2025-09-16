import type { Request, Response, NextFunction } from 'express';
import type { Role, User } from '../types/user.js';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.config.js';
import { PASSWORD_EXPIRY_DAYS } from '../config/security.config.js';

export type UserRequest = {
  id: number;
  name: string;
  role: Role;
};

export function authMiddleware(requiredRole?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.token; // read from cookie

    if (!token) return res.status(401).json({ error: 'No token provided' });

    // TODO: Refactor and move to separate functions
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
        role: Role;
      };

      // Fetch user from DB (enrich context)
      const { rows } = await pool.query(
        `SELECT id, name, email, role, password_last_changed, password_expired
         FROM users
         WHERE id = $1`,
        [decoded.id]
      );

      const user = rows[0];
      if (!user) return res.status(401).json({ error: 'User not found' });

      // Check expiration
      if (isPasswordExpired(user)) {
        return res
          .status(403)
          .json({ error: 'Password expired. Please reset your password.' });
      }

      // Check required role
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      //  Attach clean UserRequest object
      req.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch {
      res.status(401).json({ error: 'Unauthorized or expired token' });
    }
  };
}

const isPasswordExpired = (user: User) => {
  if (user.password_last_changed) {
    const passwordAge = Math.floor(
      (Date.now() - new Date(user.password_last_changed).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    return passwordAge > PASSWORD_EXPIRY_DAYS || user.password_expired;
  }
};
