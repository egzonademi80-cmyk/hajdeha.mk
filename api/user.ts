import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "e9b8168c9ece2b863894938c631e7e3b698175ff96a07b3a13a9e112a2a2a2f3";

const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool, { schema: { users } });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      username: string;
    };

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.id));

    const user = result[0];

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(401).json({ message: "Not authenticated" });
  }
}
