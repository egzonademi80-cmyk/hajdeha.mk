import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js";
import { restaurants, menuItems } from "../../shared/schema.js";
import { eq, and, ne } from "drizzle-orm";
import {
  verifyToken,
  unauthorized,
  methodNotAllowed,
  notFound,
  forbidden,
} from "./auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);

  const action = req.query.action as string;

  try {
    switch (action) {
      case 'list':
        return await handleList(req, res, user);
      case 'get':
        return await handleGet(req, res, user);
      case 'create':
        return await handleCreate(req, res, user);
      case 'update':
        return await handleUpdate(req, res, user);
      case 'delete':
        return await handleDelete(req, res, user);
      default:
        return res.status(400).json({ message: 'Invalid action. Use: list, get, create, update, delete' });
    }
  } catch (error) {
    console.error(`Restaurant ${action} error:`, error);
    return res.status(500).json({ message: 'Database error', error: String(error) });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  const userRestaurants = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.userId, user.userId));

  return res.status(200).json(userRestaurants);
}

async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  let idParam = req.query.id;

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
      debug: { url: req.url, query: req.query, idParam, parsedId: id },
    });
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id));

  console.log("🔍 restaurant found:", !!restaurant);

  if (!restaurant) return notFound(res);
  if (restaurant.userId !== user.userId) return forbidden(res);

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, id));

  return res.status(200).json({ ...restaurant, menuItems: items });
}

async function handleCreate(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const {
    name,
    slug,
    description,
    photoUrl,
    website,
    phoneNumber,
    location,
    openingTime,
    closingTime,
    active,
    latitude,
    longitude,
  } = req.body;

  const [existing] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.slug, slug));

  if (existing) {
    return res
      .status(400)
      .json({ message: "Slug already exists. Please choose a different URL slug." });
  }

  const [newRestaurant] = await db
    .insert(restaurants)
    .values({
      name,
      slug,
      description,
      photoUrl,
      website,
      phoneNumber,
      location,
      openingTime,
      closingTime,
      active: active ?? true,
      latitude,
      longitude,
      userId: user.userId,
    })
    .returning();

  return res.status(201).json(newRestaurant);
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "PUT" && req.method !== "PATCH") return methodNotAllowed(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/restaurants\/(\d+)/);
    if (match) {
      idParam = match[1];
    }
  }

  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");

  if (isNaN(id)) {
    return res.status(400).json({
      message: "Invalid ID",
      debug: { url: req.url, query: req.query, idParam, parsedId: id },
    });
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id));

  if (!restaurant) return notFound(res);
  if (restaurant.userId !== user.userId) return forbidden(res);

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
      if (key === "latitude" || key === "longitude" || key === "tableCount") {
        updateData[key] = body[key] !== null && body[key] !== "" ? Number(body[key]) : null;
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
      .where(and(eq(restaurants.slug, updateData.slug), ne(restaurants.id, id)));

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

async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "DELETE") return methodNotAllowed(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/restaurants\/(\d+)/);
    if (match) {
      idParam = match[1];
    }
  }

  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");

  if (isNaN(id)) {
    return res.status(400).json({
      message: "Invalid ID",
      debug: { url: req.url, query: req.query, idParam },
    });
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, id));

  if (!restaurant) return notFound(res);
  if (restaurant.userId !== user.userId) return forbidden(res);

  await db.delete(menuItems).where(eq(menuItems.restaurantId, id));
  await db.delete(restaurants).where(eq(restaurants.id, id));

  return res.status(200).json({
    message: "Restaurant and all menu items deleted successfully",
  });
}
