cat > (api / _db.ts) << "EOF";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const sql = neon(process.env.DATABASE_URL);

// Import schema directly - Vercel needs explicit imports
import { users, restaurants, menuItems } from "../shared/schema.js";

export const db = drizzle(sql, {
  schema: { users, restaurants, menuItems },
});

export { users, restaurants, menuItems };
EOF;
