import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../server/db.js';
import { menuItems, restaurants } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyToken, unauthorized, methodNotAllowed, forbidden } from '../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  if (req.method === 'GET') {
    const { restaurantId: rid } = req.query;
    const restaurantId = parseInt(Array.isArray(rid) ? rid[0] : rid || '');
    
    if (isNaN(restaurantId)) return res.status(400).json({ message: 'restaurantId is required' });

    try {
      // Ownership check
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
      if (!restaurant || restaurant.userId !== user.userId) return forbidden(res);

      const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
      return res.status(200).json(items);
    } catch (error) {
      return res.status(500).json({ message: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { restaurantId } = req.body;
      const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, restaurantId));
      if (!restaurant || restaurant.userId !== user.userId) return forbidden(res);

      const [newItem] = await db.insert(menuItems).values(req.body).returning();
      return res.status(201).json(newItem);
    } catch (error) {
      return res.status(500).json({ message: 'Database error' });
    }
  }

  return methodNotAllowed(res);
}
