import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js";
import { restaurants } from "../../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const list = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        slug: restaurants.slug,
        photoUrl: restaurants.photoUrl,
        openingTime: restaurants.openingTime,
        closingTime: restaurants.closingTime,
      })
      .from(restaurants);

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const result = list.map((r) => {
      const [openHour, openMin] = r.openingTime.split(":").map(Number);
      const [closeHour, closeMin] = r.closingTime.split(":").map(Number);

      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      const isOpen =
        currentMinutes >= openMinutes && currentMinutes <= closeMinutes;

      return { ...r, isOpen };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Public GET restaurants error:", error);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}
