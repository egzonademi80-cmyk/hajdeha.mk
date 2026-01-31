import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema.js"; // relative path nga server/db.ts te shared/schema.js

const { Pool } = pg;

// Connection string direkt (sepse nuk ke .env)
const connectionString =
  "postgresql://neondb_owner:npg_eZ0IwR3cXxuD@ep-tiny-rain-ah5sdn17-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

// Pool me 1 lidhje (serverless safe)
export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

// Drizzle ORM client
export const db = drizzle(pool, { schema });
