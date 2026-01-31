import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js";
import { restaurants } from "../../shared/schema.js";

function isOpenNow(openingTime: string, closingTime: string): boolean {
  const now = new Date();
  const [openH, openM] = openingTime.split(":").map(Number);
  const [closeH, closeM] = closingTime.split(":").map(Number);

  const nowTotal = now.getHours() * 60 + now.getMinutes();
  const openTotal = openH * 60 + openM;
  const closeTotal = closeH * 60 + closeM;

  // Nëse closingTime është pas mesnate
  if (closeTotal < openTotal) {
    return nowTotal >= openTotal || nowTotal <= closeTotal;
  }

  return nowTotal >= openTotal && nowTotal <= closeTotal;
}

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
        active: restaurants.active,
        openingTime: restaurants.openingTime,
        closingTime: restaurants.closingTime,
      })
      .from(restaurants);

    // Shto fushën isOpen për secilin restaurat
    const result = list.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      photoUrl: r.photoUrl,
      active: r.active,
      isOpen: isOpenNow(r.openingTime, r.closingTime),
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Public GET restaurants error:", error);
    return res.status(500).json({ message: "Failed to fetch restaurants" });
  }
}
