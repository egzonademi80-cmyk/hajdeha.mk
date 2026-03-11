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

async function parseBody(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
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
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, id));
    if (!restaurant) return notFound(res);
    if (restaurant.userId !== user.userId) return forbidden(res);

    if (req.method === "GET") {
      const items = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.restaurantId, id));
      return res.status(200).json({ ...restaurant, menuItems: items });
    }

    if (req.method === "PUT" || req.method === "PATCH") {
      // DEBUG LOGS
      console.log("=== DEBUG ===");
      console.log("Content-Type:", req.headers["content-type"]);
      console.log("req.body type:", typeof req.body);
      console.log("req.body value:", JSON.stringify(req.body));
      console.log("=============");

      const rawBody = await parseBody(req);
      console.log("Parsed body:", JSON.stringify(rawBody));

      const body = { ...rawBody };
      delete body.id;
      delete body.userId;

      const updateData: any = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined)
        updateData.description = body.description;
      if (body.descriptionAl !== undefined)
        updateData.descriptionAl = body.descriptionAl;
      if (body.descriptionMk !== undefined)
        updateData.descriptionMk = body.descriptionMk;
      if (body.slug !== undefined) updateData.slug = body.slug;
      if (body.photoUrl !== undefined) updateData.photoUrl = body.photoUrl;
      if (body.website !== undefined) updateData.website = body.website;
      if (body.phoneNumber !== undefined)
        updateData.phoneNumber = body.phoneNumber;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.openingTime !== undefined)
        updateData.openingTime = body.openingTime;
      if (body.closingTime !== undefined)
        updateData.closingTime = body.closingTime;
      if (body.active !== undefined) updateData.active = body.active;
      if (body.latitude !== undefined)
        updateData.latitude = body.latitude ? Number(body.latitude) : null;
      if (body.longitude !== undefined)
        updateData.longitude = body.longitude ? Number(body.longitude) : null;
      if (body.tableCount !== undefined)
        updateData.tableCount = Number(body.tableCount);

      console.log("updateData:", JSON.stringify(updateData));

      if (Object.keys(updateData).length === 0) {
        console.log(
          "updateData is empty! rawBody was:",
          JSON.stringify(rawBody),
        );
        return res.status(400).json({
          message: "No fields to update",
          receivedBody: rawBody,
        });
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
      return res.status(200).json(updated);
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
