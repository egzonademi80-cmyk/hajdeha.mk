import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js"; // relative path nga api/restaurants
import { restaurants } from "../../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Nxjerr të gjithë restorantet
    const list = await db
      .select({
        id: restaurants.id,
        name: restaurants.name,
        slug: restaurants.slug,
        photoUrl: restaurants.photoUrl,
        active: restaurants.active,
      })
      .from(restaurants);

    return res.status(200).json(list);
  } catch (error: any) {
    console.error("Public GET restaurants error:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch restaurants", details: error.message });
  }
}
