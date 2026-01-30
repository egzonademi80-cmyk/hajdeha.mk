import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

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

  const { id } = req.query;
  const restaurantId = parseInt(id as string);

  if (isNaN(restaurantId)) {
    return res.status(400).json({ error: 'Invalid restaurant ID' });
  }

  // GET - Get specific restaurant
  if (req.method === 'GET') {
    try {
      const result = await db.select().from(restaurants).where(
        and(eq(restaurants.id, restaurantId), eq(restaurants.userId, userId))
      );
      
      if (result.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      return res.status(200).json(result[0]);
    } catch (error) {
      console.error('Get restaurant error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // PATCH/PUT - Update restaurant
  if (req.method === 'PATCH' || req.method === 'PUT') {
    try {
      const updated = await db.update(restaurants)
        .set(req.body)
        .where(and(eq(restaurants.id, restaurantId), eq(restaurants.userId, userId)))
        .returning();
      
      if (updated.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      return res.status(200).json(updated[0]);
    } catch (error) {
      console.error('Update restaurant error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // DELETE - Delete restaurant
  if (req.method === 'DELETE') {
    try {
      const deleted = await db.delete(restaurants)
        .where(and(eq(restaurants.id, restaurantId), eq(restaurants.userId, userId)))
        .returning();
      
      if (deleted.length === 0) {
        return res.status(404).json({ error: 'Restaurant not found' });
      }
      
      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error('Delete restaurant error:', error);
      return res.status(500).json({ error: 'Database error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
