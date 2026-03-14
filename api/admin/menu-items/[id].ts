import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../server/db.js";
import { menuItems, restaurants } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import {
  verifyToken,
  unauthorized,
  methodNotAllowed,
  notFound,
  forbidden,
} from "../auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/menu-items\/(\d+)/);
    if (match) {
      idParam = match[1];
    }
  }

  console.log("🔍 DEBUG menu-items - req.url:", req.url);
  console.log("🔍 DEBUG menu-items - req.query:", JSON.stringify(req.query));
  console.log("🔍 DEBUG menu-items - idParam:", idParam);

  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");
  console.log("🔍 DEBUG menu-items - parsed id:", id, "isNaN:", isNaN(id));

  if (isNaN(id))
    return res.status(400).json({
      message: "Invalid ID",
      debug: { url: req.url, query: req.query, idParam },
    });

  try {
    console.log(
      "Menu item operation - ID:",
      id,
      "Method:",
      req.method,
      "User:",
      user.userId,
    );

    const [item] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));

    if (!item) {
      console.log("Menu item not found:", id);
      return notFound(res);
    }

    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, item.restaurantId));

    if (!restaurant) {
      console.log("Restaurant not found for menu item:", item.restaurantId);
      return notFound(res);
    }

    if (restaurant.userId !== user.userId) {
      console.log(
        "Forbidden - Restaurant userId:",
        restaurant.userId,
        "User:",
        user.userId,
      );
      return forbidden(res);
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      console.log("Updating menu item with data (keys):", Object.keys(req.body || {}));

      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.restaurantId;

      const [updated] = await db
        .update(menuItems)
        .set(updateData)
        .where(eq(menuItems.id, id))
        .returning();

      console.log("Menu item updated successfully:", updated?.id);
      return res.status(200).json(updated);
    }

    if (req.method === "DELETE") {
      console.log("Deleting menu item:", id);

      await db.delete(menuItems).where(eq(menuItems.id, id));

      console.log("Menu item deleted successfully");
      return res.status(200).json({ message: "Menu item deleted successfully" });
    }

    return methodNotAllowed(res);
  } catch (error) {
    console.error("Menu item [id] error:", error);
    return res
      .status(500)
      .json({ message: "Database error", error: String(error) });
  }
}
