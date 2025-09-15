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
  console.log(DATABASE_URL);
  try {
    // ⚠️ Dev/demo only — clears all tables before seeding
    await pool.query('DELETE FROM withdrawals CASCADE');
    await pool.query('DELETE FROM loans CASCADE');
    await pool.query('DELETE FROM contributions CASCADE');
    await pool.query('DELETE FROM users CASCADE');
    await pool.query('DELETE FROM departments CASCADE');
    await pool.query('DELETE FROM positions CASCADE');

    // Seed Departments
    const departments = await pool.query(
      `INSERT INTO departments (name) VALUES 
        ('Human Resources'), 
        ('Finance'), 
        ('IT') 
       RETURNING id, name`
    );

    const hrDeptId = departments.rows.find(
      d => d.name === 'Human Resources'
    ).id;
    const itDeptId = departments.rows.find(d => d.name === 'IT').id;

    // Seed Positions
    const positions = await pool.query(
      `INSERT INTO positions (title) VALUES 
        ('HR Officer'), 
        ('Finance Analyst'), 
        ('Software Engineer') 
       RETURNING id, title`
    );

    const hrOfficerId = positions.rows.find(p => p.title === 'HR Officer').id;
    const softwareEngineerId = positions.rows.find(
      p => p.title === 'Software Engineer'
    ).id;

    // Insert HR account
    const hrPassword = await bcrypt.hash('HR_Str0ngP@ss!', 10);
    await pool.query(
      `INSERT INTO users 
       (name, email, password_hash, role, date_hired, employee_id, temp_password, temp_password_expires,
        salary, employment_status, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, $6, false, NULL, $7, $8, $9, $10)`,
      [
        'HR Admin',
        'hr@metrobank.com.ph',
        hrPassword,
        'HR',
        '2020-01-15',
        '10-12345',
        80000,
        'Active',
        hrDeptId,
        hrOfficerId,
      ]
    );

    // Insert Employee account with temporary password
    const tempPassword = generateTempPassword();
    const employeePassword = await bcrypt.hash(tempPassword, 10);
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    const { rows } = await pool.query(
      `INSERT INTO users 
       (name, email, password_hash, role, date_hired, employee_id, temp_password, temp_password_expires,
        salary, employment_status, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11)
       RETURNING id, name, email, role, employee_id, temp_password_expires, salary, employment_status, department_id, position_id`,
      [
        'Juan Dela Cruz',
        'juan@metrobank.com.ph',
        employeePassword,
        'Employee',
        '2023-06-01',
        '11-12345',
        expiresAt,
        40000,
        'Active',
        itDeptId,
        softwareEngineerId,
      ]
    );

    const employeeId = rows[0].id;

    // Seed Contributions (monthly from June 2023 → August 2025)
    const contributions: { date: string; emp: number; er: number }[] = [];

    const start = new Date('2023-06-01');
    const end = new Date('2025-08-01');

    for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
      const monthDate = new Date(d);
      // last day of month
      const lastDay = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth() + 1,
        0
      );
      contributions.push({
        date: lastDay.toISOString().split('T')[0] ?? '',
        emp: 2000,
        er: 2000,
      });
    }

    for (const c of contributions) {
      await pool.query(
        `INSERT INTO contributions 
         (user_id, contribution_date, employee_amount, employer_amount) 
         VALUES ($1, $2, $3, $4)`,
        [employeeId, c.date, c.emp, c.er]
      );
    }

    // Seed Active Loan
    await pool.query(
      `INSERT INTO loans (user_id, amount, status, created_at)
       VALUES ($1, $2, 'Active', NOW())`,
      [employeeId, 10000]
    );

    console.log(
      '✅ HR account seeded (login: hr@metrobank.com.ph / HR_Str0ngP@ss!)'
    );
    console.log('✅ Employee account seeded:');
    console.log('   Email:', rows[0].email);
    console.log('   Temp Password (valid 5 days):', tempPassword);
    console.log('   Contributions: seeded monthly from Jun 2023 → Aug 2025');
    console.log('   Active Loan: ₱10,000');
  } catch (err) {
    console.error('❌ Error seeding users:', err);
  } finally {
    await pool.end();
  }
}

seedUsers();
