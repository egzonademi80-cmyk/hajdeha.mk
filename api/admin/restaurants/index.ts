import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../../server/db.js';
import { restaurants } from '../../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { verifyToken, unauthorized, methodNotAllowed } from '../auth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  if (req.method === 'GET') {
    try {
      const userRestaurants = await db.select().from(restaurants).where(eq(restaurants.userId, user.userId));
      return res.status(200).json(userRestaurants);
    } catch (error) {
      console.error('GET restaurants error:', error);
      return res.status(500).json({ message: 'Database error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { name, slug, description, photoUrl, website, phoneNumber, location, openingTime, closingTime, active, latitude, longitude } = req.body;
      
      // Check slug uniqueness
      const [existing] = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
      if (existing) {
        return res.status(400).json({ message: 'Slug already exists. Please choose a different URL slug.' });
      }
      
      const [newRestaurant] = await db.insert(restaurants).values({
        name,
        slug,
        description,
        photoUrl,
        website,
        phoneNumber,
        location,
        openingTime,
        closingTime,
        active: active ?? true,
        latitude,
        longitude,
        userId: user.userId
      }).returning();
      
      return res.status(201).json(newRestaurant);
    } catch (error) {
      console.error('POST restaurant error:', error);
      return res.status(500).json({ message: 'Database error' });
    }
  }

  return methodNotAllowed(res);
}
