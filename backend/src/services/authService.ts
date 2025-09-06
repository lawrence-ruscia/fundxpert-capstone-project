import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.config.js';
import type { User } from '../types/user.js';

export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: string,
  date_hired: string | undefined
): Promise<User> {
  const hash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, date_hired) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, date_hired`,
    [name, email, hash, role, date_hired]
  );

  return result.rows[0];
}

export async function loginUser(email: string, password: string) {
  const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  return { token, user: { id: user.id, name: user.name, role: user.role } };
}
