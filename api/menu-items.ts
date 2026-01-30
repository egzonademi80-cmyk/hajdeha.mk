import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";

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

export default async function handler(_req: any, res: any) {
  try {
    const allMenuItems = await db.select().from(menuItems);
    res.status(200).json(allMenuItems);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
