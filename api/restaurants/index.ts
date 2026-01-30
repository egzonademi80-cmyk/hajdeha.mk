import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../server/db';
import { restaurants, menuItems } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const allRestaurants = await db.select().from(restaurants);
    const enriched = await Promise.all(allRestaurants.map(async (r) => {
      const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, r.id));
      return { ...r, menuItems: items };
    }));
    
    return res.status(200).json(enriched);
  } catch (error) {
    console.error('Public GET restaurants error:', error);
    return res.status(500).json({ message: 'Database error' });
  }
}
