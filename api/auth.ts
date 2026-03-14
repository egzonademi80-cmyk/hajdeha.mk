import { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { compare } from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "e9b8168c9ece2b863894938c631e7e3b698175ff96a07b3a13a9e112a2a2a2f3";

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
  const action = req.query.action as string;

  try {
    switch (action) {
      case 'login':
        return await handleLogin(req, res);
      case 'logout':
        return await handleLogout(req, res);
      case 'me':
        return await handleGetUser(req, res);
      case 'list':
        return await handleListUsers(req, res);
      default:
        return res.status(400).json({ message: 'Invalid action. Use: login, logout, me, list' });
    }
  } catch (error) {
    console.error(`Auth ${action} error:`, error);
    return res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const [user] = await db.select().from(users).where(eq(users.username, username));

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isMatch = await compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return res.status(200).json({
    token,
    user: { id: user.id, username: user.username },
  });
}

async function handleLogout(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({ ok: true });
}

async function handleGetUser(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const token = authHeader.substring(7);

  const decoded = jwt.verify(token, JWT_SECRET) as {
    id: number;
    username: string;
  };

  const result = await db.select().from(users).where(eq(users.id, decoded.id));
  const user = result[0];

  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { password: _, ...userWithoutPassword } = user;

  return res.status(200).json({ user: userWithoutPassword });
}

async function handleListUsers(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allUsers = await db.select().from(users);
  return res.status(200).json(allUsers);
}
