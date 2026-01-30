import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db.js';
import { restaurants, menuItems } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

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
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurant.id));
    return res.status(200).json({ ...restaurant, menuItems: items });
  } catch (error) {
    console.error('Public GET restaurant by slug error:', error);
    return res.status(500).json({ message: 'Database error' });
  }
}
