import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db";
import { restaurants } from "../../shared/schema";

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
        image: restaurants.image,
      })
      .from(restaurants);

    return res.status(200).json(list);
  } catch (error) {
    console.error("Public GET restaurants error:", error);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}
