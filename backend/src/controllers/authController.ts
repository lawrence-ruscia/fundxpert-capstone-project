import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { pool } from '../config/db.config.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt from 'jsonwebtoken';

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
    const result = await authService.loginUser(email, password);

    if ('twofaRequired' in result && result.twofaRequired) {
      res.json({ twofaRequired: result.twofaRequired, userId: result.userId });
      return;
    }

    if ('token' in result && result.token) {
      res.json({ token: result.token, user: result.user });
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(401).json({ error: err.message });
    }
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    console.log(req.body);
    const { userId, newPassword } = req.body;
    const result = await authService.resetPassword(userId, newPassword);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
}

export async function setup2FA(req: Request, res: Response) {
  try {
    const userId = req.body.userId;

    // Generate a new secret (base32 = what authenticator apps use)
    const secret = speakeasy.generateSecret({
      name: 'FundXpert',
      length: 20,
    });

    // Convert the "otpauth" URL into a QR code image (base64)
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url || '');

    // Store the secret temporarily in DB (but don't enable 2FA yet)
    const queryRes = await pool.query(
      `UPDATE users SET twofa_secret = $1 WHERE id = $2`,
      [secret.base32, userId]
    );

    console.log('Query result: ', queryRes);

    res.json({
      message: 'Scan this QR code with Google Authenticator',
      qrCode: qrCodeDataURL, // Frontend shows this image
      secret: secret.base32, // ⚠️ for debugging only; normally not sent
    });
  } catch (err) {
    console.error('2FA setup error: ', err);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
}

export async function verify2FASetup(req: Request, res: Response) {
  try {
    const { userId, token } = req.body; // 6-digit code from Google Authenticator

    // Fetch stored secret for this user
    const { rows } = await pool.query(
      'SELECT twofa_secret FROM users WHERE id = $1',
      [userId]
    );
    const user = rows[0];
    console.log(user);
    if (!user || !user.twofa_secret) {
      return res.status(400).json({ error: '2FA not initiated' });
    }

    // Verify the token using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token,
      window: 1, // allow 30s clock drift
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    // Mark 2FA as enabled
    await pool.query(`UPDATE users SET is_twofa_enabled = true WHERE id = $1`, [
      userId,
    ]);

    res.json({ message: '2FA successfully enabled' });
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({ error: 'Failed to verify 2FA setup' });
  }
}

export async function loginWith2FA(req: Request, res: Response) {
  try {
    const { userId, token } = req.body;

    // Fetch secret from DB
    const { rows } = await pool.query(
      'SELECT id, name, role, twofa_secret FROM users WHERE id = $1',
      [userId]
    );
    const user = rows[0];
    if (!user || !user.twofa_secret) {
      return res.status(400).json({ error: '2FA nto enabled' });
    }

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token' });
    }

    // Generate JWT
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.json({
      token: jwtToken,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('2fa login error: ', err);
    res.status(500).json({ error: 'Login with 2FA failed' });
  }
}
