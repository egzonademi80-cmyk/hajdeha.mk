import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, serial, integer, text, boolean } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "e9b8168c9ece2b863894938c631e7e3b698175ff96a07b3a13a9e112a2a2a2f3";

const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  category: text("category").default("Main"),
  active: boolean("active").default(true).notNull(),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const db = drizzle(pool, { schema: { menuItems } });

function verifyToken(req: VercelRequest): number | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    return (jwt.verify(token, JWT_SECRET) as { id: number }).id;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const menuItemId = parseInt(req.query.id as string);
  if (isNaN(menuItemId))
    return res.status(400).json({ error: "Invalid menu item ID" });

  if (req.method === "PATCH") {
    const updated = await db
      .update(menuItems)
      .set(req.body)
      .where(eq(menuItems.id, menuItemId))
      .returning();
    if (!updated.length)
      return res.status(404).json({ error: "Menu item not found" });
    return res.status(200).json(updated[0]);
  }

  if (req.method === "DELETE") {
    const deleted = await db
      .delete(menuItems)
      .where(eq(menuItems.id, menuItemId))
      .returning();
    if (!deleted.length)
      return res.status(404).json({ error: "Menu item not found" });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
