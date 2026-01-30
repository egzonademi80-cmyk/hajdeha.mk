import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "ffc349504874a85f4559da9703b8be2ccfc56d9202b2a673c00561d5b59ae7e0";

const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  restaurantId: integer("restaurant_id").notNull(),
  name: text("name").notNull(),
  nameAl: text("name_al"),
  nameMk: text("name_mk"),
  description: text("description"),
  descriptionAl: text("description_al"),
  descriptionMk: text("description_mk"),
  price: text("price").notNull(),
  category: text("category").notNull().default("Main"),
  imageUrl: text("image_url"),
  active: boolean("active").default(true).notNull(),
  isVegetarian: boolean("is_vegetarian").default(false).notNull(),
  isVegan: boolean("is_vegan").default(false).notNull(),
  isGlutenFree: boolean("is_gluten_free").default(false).notNull(),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool, { schema: { menuItems } });

function verifyToken(req: VercelRequest): number | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    return decoded.id;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = verifyToken(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id, restaurantId } = req.query;
  const menuItemId = id ? parseInt(id as string) : null;

  // GET - List menu items for a restaurant
  if (req.method === "GET") {
    if (!restaurantId) {
      return res.status(400).json({ error: "Restaurant ID required" });
    }

    try {
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, parseInt(restaurantId as string)));
      return res.status(200).json(items);
    } catch (error) {
      console.error("Get menu items error:", error);
      return res.status(500).json({ error: "Database error" });
    }
  }

  // POST - Create menu item
  if (req.method === "POST") {
    try {
      const newItem = await db.insert(menuItems).values(req.body).returning();
      return res.status(201).json(newItem[0]);
    } catch (error) {
      console.error("Create menu item error:", error);
      return res.status(500).json({ error: "Database error" });
    }
  }

  // PATCH/PUT - Update menu item
  if (req.method === "PATCH" || req.method === "PUT") {
    if (!menuItemId) {
      return res.status(400).json({ error: "Menu item ID required" });
    }

    try {
      const updated = await db
        .update(menuItems)
        .set(req.body)
        .where(eq(menuItems.id, menuItemId))
        .returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      return res.status(200).json(updated[0]);
    } catch (error) {
      console.error("Update menu item error:", error);
      return res.status(500).json({ error: "Database error" });
    }
  }

  // DELETE - Delete menu item
  if (req.method === "DELETE") {
    if (!menuItemId) {
      return res.status(400).json({ error: "Menu item ID required" });
    }

    try {
      const deleted = await db
        .delete(menuItems)
        .where(eq(menuItems.id, menuItemId))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Menu item not found" });
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Delete menu item error:", error);
      return res.status(500).json({ error: "Database error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
