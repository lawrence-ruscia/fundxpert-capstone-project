import { pool } from '../../config/db.config.js';

type VestedUser = {
  total: number;
  date_hired: string;
  employment_status: string;
};

export const getLoanReason = (
  vestedUser: VestedUser,
  hasActiveLoan: boolean
) => {
  const vestedBalance = Number(vestedUser.total);
  let eligible = true;
  let reason: string | null = null;

  if (vestedUser.employment_status !== 'Active') {
    eligible = false;
    reason = 'Employment status not Active';
  } else if (vestedBalance <= 0) {
    eligible = false;
    reason = 'No vested balance';
  } else if (hasActiveLoan) {
    eligible = false;
    reason = 'Existing active loan';
  }

  return { eligible, reason };
};

export const getVestedBalance = async (
  vestedUser: VestedUser,
  userId: number
) => {
  const hireDate = new Date(vestedUser.date_hired);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

  let vestedBalance = Number(vestedUser.total);
  if (hireDate > twoYearsAgo) {
    // Not vested in employer contributions
    const empQuery = `
          SELECT COALESCE(SUM(employee_amount), 0) AS employee_only
          FROM contributions
          WHERE user_id = $1
        `;
    const { rows: empRows } = await pool.query(empQuery, [userId]);
    vestedBalance = Number(empRows[0].employee_only);
  }

  return vestedBalance;
};
