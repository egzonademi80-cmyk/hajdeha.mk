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

// Optional: Vercel automatically parses JSON, but keep fallback for raw bodies
async function parseBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body))
    return req.body;

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }

  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  const { id: idParam } = req.query;
  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");
  if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

  try {
    // Fetch restaurant
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));

    if (!restaurant) return notFound(res);
    if (restaurant.userId !== user.userId) return forbidden(res);

    // GET: return restaurant + menu items
    if (req.method === "GET") {
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, id));
      return res.status(200).json({ ...restaurant, menuItems: items });
    }

    // PUT/PATCH: update restaurant
    if (req.method === "PUT" || req.method === "PATCH") {
      const rawBody = await parseBody(req);

      // Remove protected fields
      const { id: _id, userId: _uid, ...body } = rawBody;

      // Allowed fields
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
        if (body[key] !== undefined) updateData[key] = body[key];
      }

      // Convert numeric fields
      if (updateData.latitude !== undefined)
        updateData.latitude = updateData.latitude
          ? Number(updateData.latitude)
          : null;
      if (updateData.longitude !== undefined)
        updateData.longitude = updateData.longitude
          ? Number(updateData.longitude)
          : null;
      if (updateData.tableCount !== undefined)
        updateData.tableCount = Number(updateData.tableCount);

      if (Object.keys(updateData).length === 0)
        return res.status(400).json({
          message: "No fields to update",
          receivedBody: rawBody,
        });

      // Check slug uniqueness
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

      // Update
      const [updated] = await db
        .update(restaurants)
        .set(updateData)
        .where(eq(restaurants.id, id))
        .returning();

      return res.status(200).json(updated);
    }

    // DELETE: restaurant + menu items
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
