import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: DATABASE_URL,
});

function generateTempPassword(length = 12) {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
}

// Sample data for random generation
// Sample data for random generation

const firstNames = [
  'Maria',

  'Jose',

  'Juan',

  'Ana',

  'Antonio',

  'Carmen',

  'Francisco',

  'Dolores',

  'Manuel',

  'Isabel',

  'David',

  'Josefa',

  'Jesus',

  'Antonia',

  'Miguel',

  'Francisca',

  'Luis',

  'Cristina',

  'Carlos',

  'Rosario',

  'Pedro',

  'Juana',

  'Angel',

  'Teresa',

  'Rafael',

  'Pilar',

  'Daniel',

  'Soledad',

  'Alejandro',

  'Rosa',

  'Fernando',

  'Concepcion',

  'Jorge',

  'Mercedes',

  'Ricardo',

  'Luz',

  'Alberto',

  'Esperanza',

  'Sergio',

  'Amparo',
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

  'Ramos',

  'Castro',

  'Jimenez',

  'Morales',

  'Ortega',

  'Delgado',

  'Reyes',

  'Gutierrez',

  'Vargas',

  'Romero',

  'Herrera',

  'Medina',

  'Ruiz',

  'Castillo',

  'Torres',

  'Diaz',

  'Moreno',

  'Aguilar',

  'Mendoza',

  'Valdez',

  'Santos',

  'Rivera',

  'Bautista',

  'Villanueva',

  'Aquino',

  'Fernandez',

  'Tolentino',

  'Lim',

  'Tan',

  'Lee',
];

const emailDomains = ['@metrobank.com.ph'];

function getRandomElement(array: any[]) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomSalary() {
  // Generate salary between 25,000 and 120,000

  const baseAmount = 25000;

  const maxRange = 95000;

  const randomAmount = Math.floor(Math.random() * maxRange);

  // Round to nearest 5000

  return Math.round((baseAmount + randomAmount) / 5000) * 5000;
}

function getRandomEmployeeId() {
  // Format: XX-XXXXX (department code + 5 digits)

  const deptCodes = ['10', '20', '30', '40', '50'];

  const deptCode = getRandomElement(deptCodes);

  const randomNum = Math.floor(Math.random() * 90000) + 10000; // 5-digit number

  return `${deptCode}-${randomNum}`;
}

function getRandomHireDate() {
  // Generate hire date between 2 years ago and 6 months ago

  const sixMonthsAgo = new Date();

  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const twoYearsAgo = new Date();

  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  const randomDate = new Date(
    twoYearsAgo.getTime() +
      Math.random() * (sixMonthsAgo.getTime() - twoYearsAgo.getTime())
  );

  return randomDate.toISOString().split('T')[0];
}

function generateContributions(hireDate: string, salary: number) {
  const contributions = [];

  const startDate = new Date(hireDate);

  const currentDate = new Date();

  // Monthly contribution based on salary (5% each for employee and employer)

  const monthlyEmpContrib = Math.round(salary * 0.05);

  const monthlyErContrib = Math.round(salary * 0.05);

  for (
    let d = new Date(startDate);
    d <= currentDate;
    d.setMonth(d.getMonth() + 1)
  ) {
    const monthDate = new Date(d);

    // Last day of month

    const lastDay = new Date(
      monthDate.getFullYear(),

      monthDate.getMonth() + 1,

      0
    );

    // Add some variation (±10%)

    const empVariation = Math.random() * 0.2 - 0.1; // -10% to +10%

    const erVariation = Math.random() * 0.2 - 0.1;

    contributions.push({
      date: lastDay.toISOString().split('T')[0],

      emp: Math.round(monthlyEmpContrib * (1 + empVariation)),

      er: Math.round(monthlyErContrib * (1 + erVariation)),
    });
  }

  return contributions;
}

async function getRandomDepartmentAndPosition() {
  try {
    // Get all departments and positions

    const departments = await pool.query('SELECT id, name FROM departments');

    const positions = await pool.query('SELECT id, title FROM positions');

    if (departments.rows.length === 0 || positions.rows.length === 0) {
      throw new Error(
        'No departments or positions found. Please seed them first.'
      );
    }

    const department = getRandomElement(departments.rows);

    const position = getRandomElement(positions.rows);

    return { department, position };
  } catch (error) {
    console.error('Error fetching departments and positions:', error);

    throw error;
  }
}

async function createRandomEmployee() {
  try {
    const firstName = getRandomElement(firstNames);
    const lastName = getRandomElement(lastNames);
    const fullName = `${firstName} ${lastName}`;

    // Generate email
    const emailPrefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
    const domain = getRandomElement(emailDomains);
    let email = `${emailPrefix}${domain}`;

    // Check if email already exists
    let emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);

    // If email exists, add a random number to make it unique
    if (emailCheck.rows.length > 0) {
      console.log(`⚠️ Email ${email} already exists, creating a unique one...`);
      email = `${emailPrefix}${Math.floor(Math.random() * 1000)}${domain}`;
      emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [
        email,
      ]);
      if (emailCheck.rows.length > 0) {
        // Extremely unlikely, but good to handle
        console.log(`⚠️ Still couldn't create a unique email, skipping...`);
        return null;
      }
    }

    // Generate other details
    const employeeId = getRandomEmployeeId();
    const salary = getRandomSalary();
    const hireDate = getRandomHireDate();

    // Check if employee_id already exists
    const idCheck = await pool.query(
      'SELECT id FROM users WHERE employee_id = $1',
      [employeeId]
    );

    if (idCheck.rows.length > 0) {
      console.log(`⚠️ Employee ID ${employeeId} already exists, retrying...`);
      return createRandomEmployee(); // Retry with new ID
    }

    // Get random department and position
    const { department, position } = await getRandomDepartmentAndPosition();

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Insert employee
    const { rows } = await pool.query(
      `INSERT INTO users
        (name, email, password_hash, role, date_hired, employee_id, temp_password, temp_password_expires,
         salary, employment_status, department_id, position_id)
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8, $9, $10, $11)
        RETURNING id, name, email, employee_id`,
      [
        fullName,
        email,
        hashedPassword,
        'Employee',
        hireDate,
        employeeId,
        expiresAt,
        salary,
        'Active',
        department.id,
        position.id,
      ]
    );

    const newEmployeeId = rows[0].id;

    // --- MODIFICATION START ---
    // Generate and insert contributions, now including all fields.
    const contributions = generateContributions(hireDate, salary);
    const adminUserId = 30; // Assuming an admin with ID 1 is seeding the data.

    for (const contrib of contributions) {
      // Add a 5% chance for a contribution to be an "adjustment".
      const isAdjusted = Math.random() < 0.05;
      const notes = isAdjusted
        ? 'Manual adjustment for payroll correction.'
        : null;

      await pool.query(
        `INSERT INTO contributions
           (user_id, contribution_date, employee_amount, employer_amount,
            created_at, created_by, is_adjusted, notes)
           VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7)`,
        [
          newEmployeeId,
          contrib.date,
          contrib.emp,
          contrib.er,
          adminUserId,
          isAdjusted,
          notes,
        ]
      );
    }
    // --- MODIFICATION END ---

    // Randomly add loans (30% chance)
    if (Math.random() < 0.3) {
      const loanAmount = Math.floor(Math.random() * 50000) + 10000; // 10k to 60k
      const loanStatus = getRandomElement([
        'Active',
        'Pending',
        'Settled',
        'Rejected',
      ]); // Corrected status values
      const loanTerm = Math.floor(Math.random() * 19) + 6; // 6 to 24 months
      const loanPurpose = getRandomElement([
        'Medical',
        'Education',
        'Housing',
        'Emergency',
        'Debt',
        'Others',
      ]);

      await pool.query(
        `INSERT INTO loans (user_id, amount, status, repayment_term_months, purpose_category, consent_acknowledged, created_at)
           VALUES ($1, $2, $3, $4, $5, true, NOW() - INTERVAL '${Math.floor(
             Math.random() * 90
           )} days')`,
        [newEmployeeId, loanAmount, loanStatus, loanTerm, loanPurpose]
      );
    }

    // Calculate contribution totals for potential withdrawal request
    const contributionTotals = contributions.reduce(
      (acc, curr) => {
        acc.emp += curr.emp;
        acc.er += curr.er;
        return acc;
      },
      { emp: 0, er: 0 }
    );
    const totalBalance = contributionTotals.emp + contributionTotals.er;
    // Assuming 100% vesting for simplicity in the seed
    const vestedAmount = contributionTotals.er;
    const unvestedAmount = 0;

    // Randomly add withdrawal requests (10% chance & if contributions exist)
    if (Math.random() < 0.1 && contributions.length > 0) {
      const withdrawalStatus = getRandomElement([
        'Pending',
        'Approved',
        'Rejected',
      ]);
      const requestType = getRandomElement([
        'Resignation',
        'Retirement',
        'Other',
      ]);

      await pool.query(
        `INSERT INTO withdrawal_requests (
            user_id, status, request_type,
            employee_contribution_total, employer_contribution_total,
            vested_amount, unvested_amount, total_balance,
            consent_acknowledged, created_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW() - INTERVAL '${Math.floor(
             Math.random() * 30
           )} days')`,
        [
          newEmployeeId,
          withdrawalStatus,
          requestType,
          contributionTotals.emp,
          contributionTotals.er,
          vestedAmount,
          unvestedAmount,
          totalBalance,
        ]
      );
    }

    return {
      id: newEmployeeId,
      name: fullName,
      email: email,
      employeeId: employeeId,
      tempPassword: tempPassword,
      salary: salary,
      department: department.name,
      position: position.title,
      contributionsCount: contributions.length,
      hireDate: hireDate,
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
}

async function seedEmployees(count = 10) {
  console.log(`🌱 Starting to seed ${count} random employees...`);

  try {
    const createdEmployees = [];

    for (let i = 0; i < count; i++) {
      console.log(`Creating employee ${i + 1}/${count}...`);

      const employee = await createRandomEmployee();

      if (employee) {
        createdEmployees.push(employee);

        console.log(`✅ Created: ${employee.name} (${employee.email})`);
      }

      // Small delay to avoid overwhelming the database

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Summary:');

    console.log(`✅ Successfully created ${createdEmployees.length} employees`);

    if (createdEmployees.length > 0) {
      console.log('\n👥 Employee Details:');

      createdEmployees.forEach((emp, index) => {
        console.log(`${index + 1}. ${emp.name}`);

        console.log(`   Email: ${emp.email}`);

        console.log(`   Employee ID: ${emp.employeeId}`);

        console.log(`   Temp Password: ${emp.tempPassword}`);

        console.log(`   Salary: ₱${emp.salary.toLocaleString()}`);

        console.log(`   Department: ${emp.department}`);

        console.log(`   Position: ${emp.position}`);

        console.log(`   Hire Date: ${emp.hireDate}`);

        console.log(`   Contributions: ${emp.contributionsCount} months`);

        console.log('');
      });
    }
  } catch (error) {
    console.error('❌ Error seeding employees:', error);
  } finally {
    await pool.end();
  }
}

// Get count from command line arguments or default to 10

const employeeCount = process.argv[2] ? parseInt(process.argv[2], 10) : 10;

if (isNaN(employeeCount) || employeeCount < 1) {
  console.error('❌ Please provide a valid number of employees to create');

  console.log('Usage: node seedEmployees.js [count]');

  console.log('Example: node seedEmployees.js 25');

  process.exit(1);
}

seedEmployees(employeeCount);
