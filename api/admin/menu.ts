import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../server/db.js";
import { menuItems, restaurants } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import {
  verifyToken,
  unauthorized,
  methodNotAllowed,
  forbidden,
  notFound,
} from "./auth.js";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

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
      case 'reorder':
        return await handleReorder(req, res, user);
      default:
        return res.status(400).json({ message: 'Invalid action. Use: list, get, create, update, delete, reorder' });
    }
  } catch (error: any) {
    console.error(`Menu ${action} error:`, error);
    return res.status(500).json({ message: 'Database error', error: String(error) });
  }
}

async function handleList(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  const { restaurantId: rid } = req.query;
  const restaurantId = parseInt(Array.isArray(rid) ? rid[0] : rid || "");

  if (isNaN(restaurantId)) {
    return res.status(400).json({ message: "restaurantId is required" });
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, restaurantId));

  if (!restaurant || restaurant.userId !== user.userId) {
    return forbidden(res);
  }

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.restaurantId, restaurantId));

  return res.status(200).json(items);
}

async function handleGet(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "GET") return methodNotAllowed(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/menu\/(\d+)/);
    if (match) {
      idParam = match[1];
    }
  }

  console.log("🔍 DEBUG menu - req.url:", req.url);
  console.log("🔍 DEBUG menu - req.query:", JSON.stringify(req.query));
  console.log("🔍 DEBUG menu - idParam:", idParam);

  const id = parseInt(Array.isArray(idParam) ? idParam[0] : idParam || "");
  console.log("🔍 DEBUG menu - parsed id:", id, "isNaN:", isNaN(id));

  if (isNaN(id)) {
    return res.status(400).json({
      message: "Invalid ID",
      debug: { url: req.url, query: req.query, idParam },
    });
  }

  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));

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
    console.log("Forbidden - Restaurant userId:", restaurant.userId, "User:", user.userId);
    return forbidden(res);
  }

  return res.status(200).json(item);
}

async function handleCreate(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

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

  if (!restaurantId) {
    return res.status(400).json({ message: "restaurantId is required" });
  }
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  if (!price) {
    return res.status(400).json({ message: "price is required" });
  }

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

  const [newItem] = await db
    .insert(menuItems)
    .values({
      restaurantId,
      name,
      nameAl: nameAl || null,
      nameMk: nameMk || null,
      price,
      category: category || "Main",
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
}

async function handleUpdate(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "PUT" && req.method !== "PATCH") return methodNotAllowed(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/menu\/(\d+)/);
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

  console.log("Menu item operation - ID:", id, "Method:", req.method, "User:", user.userId);

  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));

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
    console.log("Forbidden - Restaurant userId:", restaurant.userId, "User:", user.userId);
    return forbidden(res);
  }

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

async function handleDelete(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "DELETE") return methodNotAllowed(res);

  let idParam = req.query.id;

  if (!idParam && req.url) {
    const match = req.url.match(/\/menu\/(\d+)/);
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

  const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));

  if (!item) {
    return notFound(res);
  }

  const [restaurant] = await db
    .select()
    .from(restaurants)
    .where(eq(restaurants.id, item.restaurantId));

  if (!restaurant || restaurant.userId !== user.userId) {
    return forbidden(res);
  }

  console.log("Deleting menu item:", id);
  await db.delete(menuItems).where(eq(menuItems.id, id));
  console.log("Menu item deleted successfully");

  return res.status(200).json({ message: "Menu item deleted successfully" });
}

async function handleReorder(req: VercelRequest, res: VercelResponse, user: any) {
  if (req.method !== "POST") return methodNotAllowed(res);

  const { items, restaurantId } = req.body as {
    items: { id: number; sortOrder: number }[];
    restaurantId: number;
  };

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items array is required" });
  }

  await Promise.all(
    items.map(({ id, sortOrder }) =>
      db.update(menuItems).set({ sortOrder }).where(eq(menuItems.id, id))
    )
  );

  await pusher.trigger(`restaurant-${restaurantId}`, "menu-reordered", {
    items,
    timestamp: Date.now(),
    userId: user.userId,
  });

  return res.status(200).json({ ok: true });
}
