import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validation/authValidation.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { Role } from '../types/user.js';
export const authRouter = Router();
import type { User } from '../types/user.js';

authRouter.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);
authRouter.post('/login', validateRequest(loginSchema), authController.login);

const role: Role = 'Employee';
authRouter.get('/secret', authMiddleware(role), (req, res) => {
  const { name } = req.user as User;
  res.send(`Hello Employee, ${name}`);
});
