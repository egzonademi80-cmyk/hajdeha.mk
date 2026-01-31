import { VercelRequest, VercelResponse } from '@vercel/node';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { restaurants, menuItems } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

// Use the same connection logic as server/db.ts but localized for Vercel
const connectionString = 'postgresql://neondb_owner:npg_eZ0IwR3cXxuD@ep-tiny-rain-ah5sdn17-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';
const client = postgres(connectionString, { ssl: 'require', max: 1 });
const db = drizzle(client);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { slug } = req.query;
  const restaurantSlug = Array.isArray(slug) ? slug[0] : slug;

  if (!restaurantSlug) {
    return res.status(400).json({ message: 'Slug is required' });
  }

  try {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.slug, restaurantSlug));

    if (!restaurant) {
      // Try to find by ID if the slug looks like a number
      if (!isNaN(Number(restaurantSlug))) {
        const [restaurantById] = await db.select().from(restaurants).where(eq(restaurants.id, Number(restaurantSlug)));
        if (restaurantById) {
          const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantById.id));
          return res.status(200).json({ ...restaurantById, menuItems: items });
        }
      }
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurant.id));
    return res.status(200).json({ ...restaurant, menuItems: items });
  } catch (error: any) {
    console.error('Public GET restaurant by slug error:', error);
    return res.status(500).json({ message: 'Database error', details: error.message });
  }
}
