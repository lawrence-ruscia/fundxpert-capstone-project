import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { registerSchema, loginSchema } from '../validation/authValidation.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { Role } from '../types/user.js';
export const authRouter = Router();

authRouter.post(
  '/register',
  validateRequest(registerSchema),
  authController.register
);
authRouter.post('/login', validateRequest(loginSchema), authController.login);

const emp: Role = 'Employee';
authRouter.get('/employee', authMiddleware(emp), (req, res) => {
  res.send(`Welcome back! Employee`);
});

const hr: Role = 'HR';
authRouter.get('/hr', authMiddleware(hr), (req, res) => {
  res.send(`Welcome back! HR`);
});

const admin: Role = 'Admin';
authRouter.get('/hr', authMiddleware(admin), (req, res) => {
  res.send(`Welcome back! System Admin`);
});
