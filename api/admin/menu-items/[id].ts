import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../server/db.js';
import { menuItems, restaurants } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { verifyToken, unauthorized, methodNotAllowed, notFound, forbidden } from '../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  const { id: idParam } = req.query;
  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || '');

  if (isNaN(id)) return res.status(400).json({ message: 'Invalid ID' });

  try {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (!item) return notFound(res);

    // Ownership check via restaurant
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, item.restaurantId));
    if (!restaurant || restaurant.userId !== user.userId) return forbidden(res);

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.restaurantId;

      const [updated] = await db
        .update(menuItems)
        .set(updateData)
        .where(eq(menuItems.id, id))
        .returning();
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      await db.delete(menuItems).where(eq(menuItems.id, id));
      return res.status(200).json({ message: 'Menu item deleted successfully' });
    }

    return methodNotAllowed(res);
  } catch (error) {
    return res.status(500).json({ message: 'Database error' });
  }
}
