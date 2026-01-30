import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../server/db.js';
import { restaurants, menuItems } from '../../../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import { verifyToken, unauthorized, methodNotAllowed, notFound, forbidden } from '../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  const { id: idParam } = req.query;
  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || '');

  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    // Ownership check
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    if (!restaurant) return notFound(res);
    if (restaurant.userId !== user.userId) return forbidden(res);

    if (req.method === 'GET') {
      const items = await db.select().from(menuItems).where(eq(menuItems.restaurantId, id));
      return res.status(200).json({ ...restaurant, menuItems: items });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.userId;

      const [updated] = await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, id))
        .returning();
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      // Cascade delete menu items first
      await db.delete(menuItems).where(eq(menuItems.restaurantId, id));
      await db.delete(restaurants).where(eq(restaurants.id, id));
      return res.status(200).json({ message: 'Restaurant and all menu items deleted successfully' });
    }

    return methodNotAllowed(res);
  } catch (error) {
    console.error(`Restaurant ${id} error:`, error);
    return res.status(500).json({ message: 'Database error' });
  }
}
