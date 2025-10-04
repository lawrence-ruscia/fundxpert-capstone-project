import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set!');
}

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

// --- DATA FOR RANDOM GENERATION ---

const bankData = {
  'Human Resources': [
    'HR Generalist',
    'Recruitment Specialist',
    'Compensation & Benefits Analyst',
    'HR Manager',
  ],
  'Finance & Accounting': [
    'Financial Analyst',
    'Accountant',
    'Payroll Specialist',
    'Controller',
  ],
  'Information Technology': [
    'Software Engineer',
    'Database Administrator',
    'Systems Analyst',
    'IT Support Specialist',
    'Cybersecurity Analyst',
  ],
  'Retail Banking': [
    'Bank Teller',
    'Personal Banker',
    'Loan Officer',
    'Branch Manager',
  ],
  'Corporate Banking': [
    'Relationship Manager',
    'Credit Analyst',
    'Trade Finance Specialist',
  ],
  Treasury: ['Treasury Officer', 'Forex Trader', 'Investment Analyst'],
  'Risk Management': ['Risk Analyst', 'Credit Risk Manager'],
  'Legal & Compliance': ['Compliance Officer', 'Legal Counsel'],
  Marketing: ['Marketing Specialist', 'Digital Marketing Manager'],
  Operations: ['Operations Officer', 'Clearing Officer'],
  'System Administration': ['System Administrator', 'Network Administrator'],
};

const firstNames = [
  'Maria',
  'Jose',
  'Juan',
  'Ana',
  'Antonio',
  'Carmen',
  'Francisco',
  'David',
  'Manuel',
  'Isabel',
];
const lastNames = [
  'Garcia',
  'Rodriguez',
  'Martinez',
  'Lopez',
  'Gonzalez',
  'Perez',
  'Sanchez',
  'Ramirez',
  'Cruz',
  'Flores',
];

// --- HELPER FUNCTIONS ---

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTempPassword(length = 12) {
  // Generates a password with at least one uppercase, one lowercase, one number, and one special character
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';
  const all = lower + upper + numbers + special;
  let password = '';
  password += getRandomElement(lower);
  password += getRandomElement(upper);
  password += getRandomElement(numbers);
  password += getRandomElement(special);
  for (let i = password.length; i < length; i++) {
    password += getRandomElement(all);
  }
  // Shuffle the password to ensure randomness
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
}

function getRandomSalary(min = 25000, max = 120000) {
  const randomAmount = Math.random() * (max - min) + min;
  return Math.round(randomAmount / 1000) * 1000;
}

function getRandomHireDate() {
  // Hire date between 3 years ago and 6 months ago
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  const randomDate = new Date(
    threeYearsAgo.getTime() +
      Math.random() * (sixMonthsAgo.getTime() - threeYearsAgo.getTime())
  );
  return randomDate.toISOString().split('T')[0];
}

// --- CORE SEEDING FUNCTIONS ---

/**
 * Seeds departments and positions. Can be run multiple times safely.
 */
async function seedInitialData() {
  console.log('🌱 Seeding initial departments and positions...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed Departments
    const departmentNames = Object.keys(bankData);
    for (const name of departmentNames) {
      await client.query(
        'INSERT INTO departments (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
        [name]
      );
    }

    // Seed Positions
    const positionTitles = Object.values(bankData).flat();
    for (const title of positionTitles) {
      await client.query(
        'INSERT INTO positions (title) VALUES ($1) ON CONFLICT (title) DO NOTHING',
        [title]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Initial data seeded successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding initial data:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Generates and inserts monthly contributions for a user from hire date to now.
 */
async function generateAndInsertContributions(userId, hireDate, salary) {
  const startDate = new Date(hireDate);
  const currentDate = new Date();
  // 5% of salary for employee and employer contribution
  const monthlyAmount = Math.round(salary * 0.05);

  for (
    let d = new Date(startDate);
    d <= currentDate;
    d.setMonth(d.getMonth() + 1)
  ) {
    const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    await pool.query(
      `INSERT INTO contributions
         (user_id, contribution_date, employee_amount, employer_amount, created_by)
         VALUES ($1, $2, $3, $4, 1)`, // Assuming created by Admin ID 1
      [
        userId,
        lastDayOfMonth.toISOString().split('T')[0],
        monthlyAmount,
        monthlyAmount,
      ]
    );
  }
}

/**
 * Creates a single user with a specified role.
 */
async function createRandomUser(role) {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}@metrobank.com.ph`;
  const fullName = `${firstName} ${lastName}`;

  let userData = {};

  // Get all departments and positions
  const departments = await pool.query('SELECT id, name FROM departments');
  const positions = await pool.query('SELECT id, title FROM positions');

  // --- Role-specific configuration ---
  if (role === 'Employee') {
    const departmentName = getRandomElement(
      Object.keys(bankData).filter(d => d !== 'System Administration')
    );
    const positionTitle = getRandomElement(bankData[departmentName]);
    const hireDate = getRandomHireDate();
    const tempPassword = generateTempPassword();

    userData = {
      name: fullName,
      email: email,
      password_hash: await bcrypt.hash(tempPassword, 10),
      role: 'Employee',
      date_hired: hireDate,
      employee_id: `E-${Math.floor(10000 + Math.random() * 90000)}`,
      temp_password: true,
      temp_password_expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      salary: getRandomSalary(),
      employment_status: 'Active',
      department_id: departments.rows.find(d => d.name === departmentName)?.id,
      position_id: positions.rows.find(p => p.title === positionTitle)?.id,
      logInfo: `Email: ${email}, Temp Password: ${tempPassword}`,
    };
  } else if (role === 'HR') {
    email = `hr.${lastName.toLowerCase()}@metrobank.com.ph`;
    const positionTitle = getRandomElement(bankData['Human Resources']);

    userData = {
      name: `${fullName} (HR)`,
      email: email,
      password_hash: await bcrypt.hash('HRPass123!', 10), // Permanent password for testing
      role: 'HR',
      date_hired: '2021-01-10',
      employee_id: `H-${Math.floor(10000 + Math.random() * 90000)}`,
      temp_password: false,
      temp_password_expires: null,
      salary: getRandomSalary(60000, 150000),
      employment_status: 'Active',
      department_id: departments.rows.find(d => d.name === 'Human Resources')
        ?.id,
      position_id: positions.rows.find(p => p.title === positionTitle)?.id,
      logInfo: `Email: ${email}, Password: HRPass123!`,
    };
  } else if (role === 'Admin') {
    email = `admin.${lastName.toLowerCase()}@metrobank.com.ph`;

    userData = {
      name: `${fullName} (Admin)`,
      email: email,
      password_hash: await bcrypt.hash('AdminPass123!', 10), // Permanent password for testing
      role: 'Admin',
      date_hired: '2020-01-10',
      employee_id: `A-${Math.floor(10000 + Math.random() * 90000)}`,
      temp_password: false,
      temp_password_expires: null,
      salary: getRandomSalary(80000, 200000),
      employment_status: 'Active',
      department_id: departments.rows.find(
        d => d.name === 'System Administration'
      )?.id,
      position_id: positions.rows.find(p => p.title === 'System Administrator')
        ?.id,
      logInfo: `Email: ${email}, Password: AdminPass123!`,
    };
  }

  // Insert the user into the database
  const { rows } = await pool.query(
    `INSERT INTO users
      (name, email, password_hash, role, date_hired, employee_id, temp_password, temp_password_expires, salary, employment_status, department_id, position_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
    [
      userData.name,
      userData.email,
      userData.password_hash,
      userData.role,
      userData.date_hired,
      userData.employee_id,
      userData.temp_password,
      userData.temp_password_expires,
      userData.salary,
      userData.employment_status,
      userData.department_id,
      userData.position_id,
    ]
  );

  const newUserId = rows[0].id;

  // If the user is an employee, seed their contributions
  if (role === 'Employee') {
    await generateAndInsertContributions(
      newUserId,
      userData.date_hired,
      userData.salary
    );
  }

  console.log(`  ✅ Created ${role}: ${userData.name} | ${userData.logInfo}`);
}

// --- MAIN EXECUTION ---

async function main() {
  const args = process.argv.slice(2);
  const role = args[0];
  const count = parseInt(args[1], 10) || 1;

  const validRoles = ['Employee', 'HR', 'Admin'];

  if (!role || !validRoles.includes(role)) {
    console.error('❌ Invalid role specified.');
    console.log('Usage: node seed.js <Role> [Count]');
    console.log('Example: node seed.js Employee 10');
    console.log('Valid Roles:', validRoles.join(', '));
    return;
  }

  console.log(
    `\n🚀 Starting seeder for ${count} user(s) with role "${role}"...`
  );

  try {
    // 1. Ensure base data (departments, positions) exists
    await seedInitialData();

    // 2. Create the requested users
    console.log(`\n👤 Creating ${count} ${role} user(s)...`);
    for (let i = 0; i < count; i++) {
      await createRandomUser(role);
    }

    console.log(`\n🎉 Successfully created ${count} ${role} user(s).`);
  } catch (error) {
    console.error('\n🔥 A critical error occurred during seeding:', error);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed.');
  }
}

main();
