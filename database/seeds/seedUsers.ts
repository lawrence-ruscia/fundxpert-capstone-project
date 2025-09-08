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

    // Insert HR account (permanent password, assigned department & position)
    const hrPassword = await bcrypt.hash('HR_Str0ngP@ss!', 10);
    await pool.query(
      `INSERT INTO users 
       (name, email, password_hash, role, date_hired, temp_password, temp_password_expires,
        salary, employment_status, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, false, NULL, $6, $7, $8, $9)`,
      [
        'HR Admin',
        'hr@metrobank.com.ph',
        hrPassword,
        'HR',
        '2020-01-15',
        80000, // HR salary
        'Active', // Employment status
        hrDeptId, // Department
        hrOfficerId, // Position
      ]
    );

    // Insert Employee account with temporary password
    const tempPassword = generateTempPassword();
    const employeePassword = await bcrypt.hash(tempPassword, 10);
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days

    const { rows } = await pool.query(
      `INSERT INTO users 
       (name, email, password_hash, role, date_hired, temp_password, temp_password_expires,
        salary, employment_status, department_id, position_id)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, $10)
       RETURNING id, name, email, role, temp_password_expires, salary, employment_status, department_id, position_id`,
      [
        'Juan Dela Cruz',
        'juan@metrobank.com.ph',
        employeePassword,
        'Employee',
        '2023-06-01',
        expiresAt,
        40000, // Employee salary
        'Active',
        itDeptId, // Department: IT
        softwareEngineerId, // Position: Software Engineer
      ]
    );

    console.log(
      '✅ HR account seeded (login: hr@metrobank.com.ph / HR_Str0ngP@ss!)'
    );
    console.log('✅ Employee account seeded:');
    console.log('   Email:', rows[0].email);
    console.log('   Temp Password (valid 5 days):', tempPassword);
    console.log('   Expires At:', rows[0].temp_password_expires);
    console.log('   Salary:', rows[0].salary);
    console.log('   Status:', rows[0].employment_status);
  } catch (err) {
    console.error('❌ Error seeding users:', err);
  } finally {
    await pool.end();
  }
}

seedUsers();
