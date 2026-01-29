import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean, doublePrecision, index } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

// Define tables
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  descriptionAl: text("description_al"),
  descriptionMk: text("description_mk"),
  userId: integer("user_id").notNull().references(() => users.id),
  photoUrl: text("photo_url"),
  website: text("website"),
  phoneNumber: text("phone_number"),
  location: text("location"),
  openingTime: text("opening_time").default("08:00"),
  closingTime: text("closing_time").default("22:00"),
  active: boolean("active").default(true).notNull(),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
}, (table) => ({
  slugIdx: index("slug_idx").on(table.slug),
}));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

const db = drizzle(pool, { schema: { users, restaurants } });

function verifyToken(req: VercelRequest): number | null {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
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
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get user's restaurants
    try {
      const userRestaurants = await db.select().from(restaurants).where(eq(restaurants.userId, userId));
      return res.status(200).json(userRestaurants);
    } catch (error) {
      console.error('Get restaurants error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    // Create new restaurant
    try {
      const restaurantData = { ...req.body, userId };
      const newRestaurant = await db.insert(restaurants).values(restaurantData).returning();
      return res.status(201).json(newRestaurant[0]);
    } catch (error) {
      console.error('Create restaurant error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
