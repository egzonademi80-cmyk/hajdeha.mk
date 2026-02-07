import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../server/db.js";
import { menuItems, restaurants } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import {
  verifyToken,
  unauthorized,
  methodNotAllowed,
  forbidden,
} from "../auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  if (req.method === "GET") {
    const { restaurantId: rid } = req.query;
    const restaurantId = parseInt(Array.isArray(rid) ? rid[0] : rid || "");

    if (isNaN(restaurantId))
      return res.status(400).json({ message: "restaurantId is required" });

    try {
      // Ownership check
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));
      if (!restaurant || restaurant.userId !== user.userId)
        return forbidden(res);

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId));
      return res.status(200).json(items);
    } catch (error: any) {
      console.error("GET menu items error:", error);
      return res
        .status(500)
        .json({ message: "Database error", error: String(error) });
    }
  }

  if (req.method === "POST") {
    try {
      const {
        restaurantId,
        name,
        nameAl,
        nameMk,
        price,
        category,
        description,
        descriptionAl,
        descriptionMk,
        imageUrl,
        active,
        isVegetarian,
        isVegan,
        isGlutenFree,
      } = req.body;

      // Validate required fields
      if (!restaurantId) {
        return res.status(400).json({ message: "restaurantId is required" });
      }
      if (!name) {
        return res.status(400).json({ message: "name is required" });
      }
      if (!price) {
        return res.status(400).json({ message: "price is required" });
      }

      // Ownership check
      const [restaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));

      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      if (restaurant.userId !== user.userId) {
        return forbidden(res);
      }

      // Insert menu item with all fields
      const [newItem] = await db
        .insert(menuItems)
        .values({
          restaurantId,
          name,
          nameAl: nameAl || null,
          nameMk: nameMk || null,
          price,
          category: category || "Main", // ✅ Default to 'Main' if not provided
          description: description || null,
          descriptionAl: descriptionAl || null,
          descriptionMk: descriptionMk || null,
          imageUrl: imageUrl || null,
          active: active !== undefined ? active : true,
          isVegetarian: isVegetarian || false,
          isVegan: isVegan || false,
          isGlutenFree: isGlutenFree || false,
        })
        .returning();

      return res.status(201).json(newItem);
    } catch (error: any) {
      console.error("POST menu item error:", error);
      return res.status(500).json({
        message: "Database error",
        error: error.message || String(error),
      });
    }
  }

  return methodNotAllowed(res);
}
