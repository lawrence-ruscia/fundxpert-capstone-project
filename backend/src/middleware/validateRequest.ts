import type { Request, Response, NextFunction } from 'express';
import { ZodError, ZodObject } from 'zod';

export function validateRequest(schema: ZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.safeParse(req.body); //  parse & validate
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          details: err.issues,
        });
      }
    }
  };
}
