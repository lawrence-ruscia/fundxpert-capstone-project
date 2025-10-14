import 'dotenv/config';
import { Pool } from 'pg';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

const env = envSchema.parse(process.env);
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // important for Supabase SSL
  },
});

const init = async () => {
  await pool.query('SET search_path TO public;');

  const result = await pool.query(
    'SELECT current_database(), current_schema();'
  );
  console.log('Connected to:', result.rows[0]);
};

init();
