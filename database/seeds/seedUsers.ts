import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

// Helper: generate strong temp password
// TODO: generated password must adhere to password constraints
function generateTempPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

async function seedUsers() {
  try {
    // Clear existing users (for dev/demo only!)
    await pool.query('DELETE FROM users CASCADE');

    // Insert HR account (permanent password)
    const hrPassword = await bcrypt.hash('HR_Str0ngP@ss!', 10);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, date_hired, temp_password, temp_password_expires)
       VALUES ($1, $2, $3, $4, $5, false, NULL)`,
      ['HR Admin', 'hr@metrobank.com.ph', hrPassword, 'HR', '2020-01-15']
    );

    // Insert Employee account with temporary password
    const tempPassword = generateTempPassword();
    const employeePassword = await bcrypt.hash(tempPassword, 10);
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, date_hired, temp_password, temp_password_expires)
       VALUES ($1, $2, $3, $4, $5, true, $6)
       RETURNING id, name, email, role, temp_password_expires`,
      [
        'Juan Dela Cruz',
        'juan@metrobank.com.ph',
        employeePassword,
        'Employee',
        '2023-06-01',
        expiresAt,
      ]
    );

    console.log(
      '✅ HR account seeded (login: hr@metrobank.com.ph / HR_Str0ngP@ss!)'
    );
    console.log('✅ Employee account seeded:');
    console.log('   Email:', rows[0].email);
    console.log('   Temp Password (valid 5 days):', tempPassword);
    console.log('   Expires At:', rows[0].temp_password_expires);
  } catch (err) {
    console.error('❌ Error seeding users:', err);
  } finally {
    await pool.end();
  }
}

seedUsers();
