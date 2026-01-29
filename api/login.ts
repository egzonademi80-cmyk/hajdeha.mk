import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import { scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Define users table
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Create DB connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool, { schema: { users } });

async function comparePasswords(supplied: string, stored: string) {
  const [salt, key] = stored.split(":");
  const derivedKey = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    const user = result[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await comparePasswords(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      ok: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
