import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js";
import { restaurants, menuItems } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const list = await db.select().from(restaurants);

    // Për secilin restaurant, nxjerr menuItems
    const result = await Promise.all(
      list.map(async (restaurant) => {
        const items = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.restaurantId, restaurant.id));

        return {
          ...restaurant,
          menuItems: items,
        };
      }),
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error("Public GET restaurants error:", error);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}
