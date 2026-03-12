import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../server/db.js";
import { restaurants, menuItems } from "../../../shared/schema.js";
import { eq, and, ne } from "drizzle-orm";
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

  // 🔹 Merr ID-në nga query ose URL
  let idParam = req.query.id;

  // Nëse nuk ekziston në query, provoni ta nxirrni nga URL
  if (!idParam && req.url) {
    const match = req.url.match(/\/restaurants\/(\d+)/);
    if (match) {
      idParam = match[1];
    }
  }

  console.log("🔍 DEBUG - req.url:", req.url);
  console.log("🔍 DEBUG - req.query:", JSON.stringify(req.query));
  console.log("🔍 DEBUG - idParam:", idParam);

  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");
  console.log("🔍 DEBUG - parsed id:", id, "isNaN:", isNaN(id));

  if (isNaN(id)) {
    return res.status(400).json({
      message: "Invalid ID",
      debug: {
        url: req.url,
        query: req.query,
        idParam,
        parsedId: id,
      },
    });
  }

  try {
    // Fetch restaurant & ownership check
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));

    console.log("🔍 restaurant found:", !!restaurant);

    if (!restaurant) return notFound(res);
    if (restaurant.userId !== user.userId) return forbidden(res);

    // GET: Return restaurant + menu items
    if (req.method === "GET") {
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, id));
      return res.status(200).json({ ...restaurant, menuItems: items });
    }

    // PUT / PATCH: Update restaurant
    if (req.method === "PUT" || req.method === "PATCH") {
      const body = { ...req.body };
      delete body.id;
      delete body.userId;

      const allowedFields = [
        "name",
        "description",
        "descriptionAl",
        "descriptionMk",
        "slug",
        "photoUrl",
        "website",
        "phoneNumber",
        "location",
        "openingTime",
        "closingTime",
        "active",
        "latitude",
        "longitude",
        "tableCount",
      ];

      const updateData: any = {};

      for (const key of allowedFields) {
        if (body.hasOwnProperty(key)) {
          if (
            key === "latitude" ||
            key === "longitude" ||
            key === "tableCount"
          ) {
            updateData[key] =
              body[key] !== null && body[key] !== "" ? Number(body[key]) : null;
          } else {
            updateData[key] = body[key];
          }
        }
      }

      if (Object.keys(updateData).length === 0) {
        const items = await db
          .select()
          .from(menuItems)
          .where(eq(menuItems.restaurantId, id));
        return res.status(200).json({ ...restaurant, menuItems: items });
      }

      if (updateData.slug) {
        const [existing] = await db
          .select()
          .from(restaurants)
          .where(
            and(eq(restaurants.slug, updateData.slug), ne(restaurants.id, id)),
          );
        if (existing) {
          return res.status(400).json({
            message: "Slug already exists. Please choose a different URL slug.",
          });
        }
      }

      const [updated] = await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, id))
        .returning();

      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, id));
      return res.status(200).json({ ...updated, menuItems: items });
    }

    if (req.method === "DELETE") {
      await db.delete(menuItems).where(eq(menuItems.restaurantId, id));
      await db.delete(restaurants).where(eq(restaurants.id, id));
      return res.status(200).json({
        message: "Restaurant and all menu items deleted successfully",
      });
    }

    return methodNotAllowed(res);
  } catch (error) {
    console.error(`Restaurant ${id} error:`, error);
    return res.status(500).json({ message: "Database error" });
  }
}
