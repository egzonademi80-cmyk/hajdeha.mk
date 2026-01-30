import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";

const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionAl: text("description_al"),
  descriptionMk: text("description_mk"),
  userId: integer("user_id").notNull(),
  photoUrl: text("photo_url"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  location: text("location"),
  openingTime: text("opening_time").default("08:00"),
  closingTime: text("closing_time").default("22:00"),
  active: boolean("active").default(true).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool, { schema: { restaurants } });

export default async function handler(_req: any, res: any) {
  try {
    const allRestaurants = await db.select().from(restaurants);
    res.status(200).json(allRestaurants);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
