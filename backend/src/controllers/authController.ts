import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role, date_hired } =
      req.body.data ?? req.body;

    const user = await authService.registerUser(
      name,
      email,
      password,
      role,
      date_hired
    );

    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body.data ?? req.body;
    const { token, user } = await authService.loginUser(email, password);

    res.json({ token, user });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(401).json({ error: err.message });
    }
  }
}
