import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js";

const { Pool } = pg;

// We use the environment variable which the user has set in the Replit secrets
const connectionString = 'postgresql://neondb_owner:npg_eZ0IwR3cXxuD@ep-tiny-rain-ah5sdn17-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1, 
});

export const db = drizzle(pool, { schema });
