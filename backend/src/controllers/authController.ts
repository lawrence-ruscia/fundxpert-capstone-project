import type { Request, Response } from 'express';
import * as authService from '../services/authService.js';
import { pool } from '../config/db.config.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { isAuthenticatedRequest } from './employeeControllers.js';
import { logUserAction } from '../services/adminService.js';

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
    const result = await authService.loginUser(email, password, req.ip);

    if ('forcePasswordChange' in result) {
      // Temporary password login detected
      return res.status(200).json({
        forcePasswordChange: true,
        userId: result.userId,
        message:
          'Temporary password detected. Please change your password before continuing.',
      });
    }

    if ('twofaSetupRequired' in result) {
      return res.json(result); // { twofaSetupRequired: true, userId }
    }

    if ('twofaRequired' in result) {
      return res.json(result); // { twofaRequired: true, userId }
    }

    // fallback (shouldn't happen here, since normal login goes through 2FA)
    return res.status(400).json({ error: 'Unexpected login state' });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      res.status(401).json({ error: err.message });
    }
  }
}

export async function resetPassword(req: Request, res: Response) {
  try {
    const { userId, newPassword } = req.body;
    const result = await authService.resetPassword(userId, newPassword);

    await logUserAction(userId, 'Successful Password Reset', 'Auth', 'System', {
      details: { systemMessage: result.message },
      ipAddress: req.ip ?? '::1',
    });

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
      'SELECT id, name, role, twofa_secret FROM users WHERE id = $1',
      [userId]
    );
    const user = rows[0];

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

    const expiresInMs = 60 * 60 * 1000; // 1h
    const expiryDate = Date.now() + expiresInMs;

    // Generate JWT token right away
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.token_version },
      process.env.JWT_SECRET as string,
      { expiresIn: expiresInMs / 1000 } // seconds
    );

    // Store JWT in httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresInMs,
    });

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      tokenExpiry: expiryDate,
    });
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
      'SELECT id, name, role, twofa_secret, token_version FROM users WHERE id = $1',
      [userId]
    );

    const user = rows[0];
    if (!user || !user.twofa_secret) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    // Verify OTP
    const isValid = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA token.' });
    }

    const expiresInMs = 60 * 60 * 1000; // 1h
    const expiryDate = Date.now() + expiresInMs;

    // Generate JWT token right away
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.token_version },
      process.env.JWT_SECRET as string,
      { expiresIn: expiresInMs / 1000 } // seconds
    );

    // Store JWT in httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresInMs,
    });

    await pool.query(
      `UPDATE users 
     SET last_login = NOW(),
         failed_attempts = 0,
         locked_until = NULL
     WHERE id = $1`,
      [userId]
    );

    await logUserAction(user.id, 'Successful Login', 'Auth', 'System', {
      details: { role: user.role },
      ipAddress: req.ip ?? '::1',
    });

    return res.json({
      message: '2FA login successfull',
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
      tokenExpiry: expiryDate,
    });
  } catch (err) {
    console.error('2fa login error: ', err);
    res.status(500).json({ error: 'Login with 2FA failed' });
  }
}

export async function reset2FA(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = req.user.id;

    // 1. Generate a new secret
    const secret = speakeasy.generateSecret({
      name: 'FundXpert',
      length: 20,
    });

    // 2. Store new secret, disable 2FA until verified again
    await pool.query(
      `UPDATE users 
         SET twofa_secret = $1, is_twofa_enabled = false 
         WHERE id = $2`,
      [secret.base32, userId]
    );

    // 3. Create QR code from otpauth_url
    const qrCodeDataURL = await qrcode.toDataURL(secret.otpauth_url || '');

    // 4. Return QR for re-binding
    res.json({
      message: '2FA has been reset. Please scan the new QR code.',
      qrCode: qrCodeDataURL,
    });
  } catch (err) {
    console.error('❌ Reset 2FA error:', err);
    res.status(500).json({ error: 'Failed to reset 2FA' });
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'No token provided' });

    // Decode token just to extract `exp`
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded || !decoded.exp) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokenExpiry = decoded.exp * 1000; // convert seconds -> ms

    res.json({
      user: req.user, // the deserialized user
      tokenExpiry, // absolute expiry timestamp (ms)
    });
  } catch (err) {
    console.error('getCurrentUser error:', (err as Error).message);
    res.status(401).json({ error: 'Unauthorized' });
  }
}

export async function logout(req: Request, res: Response) {
  if (!isAuthenticatedRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = req.user.id;
  const role = req.user.role;

  // Increment token version to invalidate all existing tokens
  await pool.query(
    `UPDATE users SET token_version = token_version + 1 WHERE id = $1`,
    [req.user.id]
  );

  // Clear the JWT cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  await logUserAction(userId, 'Successful Logout', 'Auth', 'System', {
    details: { role },
    ipAddress: req.ip ?? '::1',
  });

  res.json({ message: 'Logged out successfully' });
}

export async function refreshSession(req: Request, res: Response) {
  try {
    if (!isAuthenticatedRequest(req))
      return res.status(401).json({ error: 'Not authenticated' });

    const userId = req.user.id;

    // Fetch secret from DB
    const { rows } = await pool.query(
      'SELECT id, name, role, twofa_secret, token_version FROM users WHERE id = $1',
      [userId]
    );

    const user = rows[0];

    const expiresInMs = 60 * 60 * 1000; // 1h
    const expiryDate = Date.now() + expiresInMs;

    // Generate JWT token right away
    const jwtToken = jwt.sign(
      { id: user.id, role: user.role, tokenVersion: user.token_version },
      process.env.JWT_SECRET as string,
      { expiresIn: expiresInMs / 1000 } // seconds
    );

    // Store JWT in httpOnly cookie
    res.cookie('token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: expiresInMs,
    });

    res.json({ success: true, tokenExpiry: expiryDate });
  } catch (err) {
    if (err) res.status(500).json({ error: 'Could not refresh session' });
  }
}
