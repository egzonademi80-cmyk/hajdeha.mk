import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema"; // <-- pa .js

const { Pool } = pg;

// Direkt connection string (përdor vetë stringun tënd)
const connectionString =
  "postgresql://neondb_owner:npg_eZ0IwR3cXxuD@ep-tiny-rain-ah5sdn17-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Serverless friendly SSL
  max: 1, // Limit connection per serverless function
});

export const db = drizzle(pool, { schema });
