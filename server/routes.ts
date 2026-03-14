import type { Express } from "express";
import { createServer, type Server } from "http";
import Pusher from "pusher";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { api } from "../shared/routes.js";
import passport from "passport";
import { db } from "./db.js";
import {
  restaurants as restaurantsTable,
  menuItems as menuItemsTable,
  pageViews,
} from "../shared/schema.js";
import { eq, sql, gte, and } from "drizzle-orm";

// ── In-memory cart store (keyed by Pusher channel name) ──────────────────────
interface CartItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}
interface TableRoom {
  cart: CartItem[];
}

const tableRooms = new Map<string, TableRoom>();

// ── Pusher server client ──────────────────────────────────────────────────────
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, (req, res, next) => {
    const validation = api.auth.login.input.safeParse(req.body);
    if (!validation.success)
      return res.status(400).json({ message: "Invalid input" });
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user)
        return res
          .status(401)
          .json({ message: info?.message || "Authentication failed" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        const { password: _pw, ...safeUser } = user;
        return res.json({ user: safeUser });
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    if (req.logout) {
      req.logout((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
    } else {
      res.sendStatus(200);
    }
  });

  app.get(api.auth.user.path, (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const { password: _pw, ...safeUser } = req.user as any;
    res.json({ user: safeUser });
  });

  // === AI CHAT PROXY ===
  app.post(api.aiChat.path, async (req, res) => {
    try {
      const { system, messages, max_tokens } = req.body;
      if (!system || !Array.isArray(messages))
        return res.status(400).json({ message: "Invalid request body" });
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error("ANTHROPIC_API_KEY is not set");
        return res.status(500).json({ message: "AI service not configured" });
      }
      const anthropicRes = await fetch(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: max_tokens ?? 600,
            system,
            messages,
          }),
        },
      );
      if (!anthropicRes.ok) {
        const err = await anthropicRes.text();
        console.error("Anthropic API error:", anthropicRes.status, err);
        return res.status(200).json({
          text: `DEBUG: ${anthropicRes.status} - ${err.slice(0, 200)}`,
        });
      }
      const data = await anthropicRes.json();
      const text: string =
        data.content
          ?.map((b: any) => b.text || "")
          .join("")
          .trim() || "";
      res.json({ text });
    } catch (err: any) {
      console.error("AI chat error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === TABLE / PUSHER ROUTES ===

  // Sync cart update to all clients via Pusher
  app.post("/api/table/cart-update", async (req, res) => {
    try {
      const { channel, cart } = req.body;
      if (!channel || !Array.isArray(cart))
        return res.status(400).json({ message: "Missing fields" });
      tableRooms.set(channel, { cart });
      await pusherServer.trigger(channel, "cart-update", { cart });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("cart-update error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // Get current cart for a channel
  app.get("/api/table/:pin/cart", (req, res) => {
    const room = tableRooms.get(req.params.pin);
    res.json({ cart: room?.cart || [] });
  });

  // Place order — notify via Pusher and clear cart
  app.post("/api/table/place-order", async (req, res) => {
    try {
      const { channel, cart, tableNumber } = req.body;
      await pusherServer.trigger(channel, "order-placed", {
        cart,
        tableNumber,
      });
      // Clear cart after order
      tableRooms.set(channel, { cart: [] });
      await pusherServer.trigger(channel, "cart-update", { cart: [] });
      res.json({ ok: true });
    } catch (err: any) {
      console.error("place-order error:", err);
      res.status(500).json({ message: err.message });
    }
  });

  // === ANALYTICS ROUTES ===

  app.post(api.analytics.track.path, async (req, res) => {
    try {
      const { restaurantId } = api.analytics.track.input.parse(req.body);
      const today = new Date().toISOString().split("T")[0];
      await db.insert(pageViews).values({ restaurantId, dateStr: today });
      res.json({ ok: true });
    } catch (err) {
      console.error("Analytics track error:", err);
      res.json({ ok: false });
    }
  });

  app.get(api.analytics.get.path, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      const today = new Date().toISOString().split("T")[0];
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      const date30 = d30.toISOString().split("T")[0];
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      const date7 = d7.toISOString().split("T")[0];

      const totalResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(eq(pageViews.restaurantId, restaurantId));
      const total = totalResult[0]?.count ?? 0;

      const todayResult = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.restaurantId, restaurantId),
            eq(pageViews.dateStr, today),
          ),
        );
      const todayCount = todayResult[0]?.count ?? 0;

      const last30Result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.restaurantId, restaurantId),
            gte(pageViews.dateStr, date30),
          ),
        );
      const last30Days = last30Result[0]?.count ?? 0;

      const last7Result = await db
        .select({ date: pageViews.dateStr, count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(
          and(
            eq(pageViews.restaurantId, restaurantId),
            gte(pageViews.dateStr, date7),
          ),
        )
        .groupBy(pageViews.dateStr);

      const last7Map = new Map(last7Result.map((r) => [r.date, r.count]));
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split("T")[0];
        last7Days.push({ date: dateStr, count: last7Map.get(dateStr) ?? 0 });
      }

      res.json({ total, today: todayCount, last7Days, last30Days });
    } catch (err) {
      console.error("Analytics get error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === RESTAURANT ROUTES ===

  app.get(api.restaurants.listAll.path, async (_req, res) => {
    const restaurants = await db.select().from(restaurantsTable);
    const enriched = await Promise.all(
      restaurants.map(async (r) => {
        const menuItems = await storage.getMenuItems(r.id);
        return { ...r, menuItems };
      }),
    );
    res.json(enriched);
  });

  app.get(api.restaurants.getBySlug.path, async (req, res) => {
    const slug = req.params.slug;
    const restaurant = await storage.getRestaurantBySlug(slug);
    if (!restaurant)
      return res.status(404).json({ message: "Restaurant not found" });
    const menuItems = await storage.getMenuItems(restaurant.id);
    res.json({ ...restaurant, menuItems });
  });

  // === ADMIN RESTAURANTS (authenticated) ===
  app.get(api.restaurants.list.path, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const restaurants = await db
      .select()
      .from(restaurantsTable)
      .where(eq(restaurantsTable.userId, user.id));
    res.json(restaurants);
  });

  app.get(api.restaurants.get.path, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const id = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(id);
    if (!restaurant) return res.status(404).json({ message: "Not found" });
    if (restaurant.userId !== user.id)
      return res.status(403).json({ message: "Forbidden" });
    const menuItems = await storage.getMenuItems(id);
    res.json({ ...restaurant, menuItems });
  });

  app.put(api.restaurants.update.path, async (req, res) => {
    try {
      if (!req.isAuthenticated())
        return res.status(401).json({ message: "Not authenticated" });
      const user = req.user as any;
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) return res.status(404).json({ message: "Not found" });
      if (restaurant.userId !== user.id)
        return res.status(403).json({ message: "Forbidden" });
      const result = api.restaurants.update.input.safeParse(req.body);
      if (!result.success)
        return res
          .status(400)
          .json({
            message: result.error.errors[0]?.message || "Invalid input",
          });
      const updated = await storage.updateRestaurant(id, result.data);
      res.json(updated);
    } catch (err: any) {
      console.error("Update restaurant error:", err);
      res.status(500).json({ message: err.message || "Failed to update" });
    }
  });

  app.post(api.restaurants.create.path, async (req, res) => {
    try {
      if (!req.isAuthenticated())
        return res.status(401).json({ message: "Not authenticated" });
      const input = api.restaurants.create.input.parse(req.body);
      const user = req.user as any;
      const restaurant = await storage.createRestaurant({
        ...input,
        userId: user.id,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
      });
      res.status(201).json(restaurant);
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      res
        .status(500)
        .json({ message: error.message || "Failed to create restaurant" });
    }
  });

  app.delete(api.restaurants.delete.path, async (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Not authenticated" });
    const user = req.user as any;
    const id = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(id);
    if (!restaurant) return res.status(404).json({ message: "Not found" });
    if (restaurant.userId !== user.id)
      return res.status(403).json({ message: "Forbidden" });
    await storage.deleteRestaurant(id);
    res.sendStatus(204);
  });

  // === MENU ITEM ROUTES ===
  // IMPORTANT: reorder registered BEFORE /:id routes
  app.post(api.menuItems.reorder.path, async (req, res) => {
    try {
      const { items } = api.menuItems.reorder.input.parse(req.body);
      await Promise.all(
        items.map(({ id, sortOrder }) =>
          db
            .update(menuItemsTable)
            .set({ sortOrder })
            .where(eq(menuItemsTable.id, id)),
        ),
      );
      res.json({ ok: true });
    } catch (err) {
      console.error("Reorder error:", err);
      res.status(500).json({ message: "Failed to reorder" });
    }
  });

  app.post(api.menuItems.create.path, async (req, res) => {
    try {
      if (!req.isAuthenticated())
        return res.status(401).json({ message: "Not authenticated" });
      const result = api.menuItems.create.input.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid input" });
      const restaurant = await storage.getRestaurant(result.data.restaurantId);
      if (!restaurant)
        return res.status(404).json({ message: "Restaurant not found" });
      const item = await storage.createMenuItem(result.data);
      res.status(201).json(item);
    } catch (err: any) {
      console.error("Create menu item error:", err);
      res.status(500).json({ message: err.message || "Failed to create item" });
    }
  });

  app.put(api.menuItems.update.path, async (req, res) => {
    try {
      if (!req.isAuthenticated())
        return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      const item = await storage.getMenuItem(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      const result = api.menuItems.update.input.safeParse(req.body);
      if (!result.success)
        return res.status(400).json({ message: result.error.errors[0]?.message || "Invalid input" });
      const updated = await storage.updateMenuItem(id, result.data);
      res.json(updated);
    } catch (err: any) {
      console.error("Update menu item error:", err);
      res.status(500).json({ message: err.message || "Failed to update item" });
    }
  });

  app.delete(api.menuItems.delete.path, async (req, res) => {
    try {
      if (!req.isAuthenticated())
        return res.status(401).json({ message: "Not authenticated" });
      const id = parseInt(req.params.id);
      const item = await storage.getMenuItem(id);
      if (!item) return res.status(404).json({ message: "Item not found" });
      await storage.deleteMenuItem(id);
      res.sendStatus(204);
    } catch (err: any) {
      console.error("Delete menu item error:", err);
      res.status(500).json({ message: err.message || "Failed to delete item" });
    }
  });

  // === SEED DATA ===
  seedDatabase(hashPassword).catch((err) => {
    console.warn("[seed] Skipped:", err?.message ?? err);
  });

  return httpServer;
}

async function seedDatabase(hashPassword: (pwd: string) => Promise<string>) {
  const admin = await storage.getUserByUsername("hajdeha");
  if (admin) return;
  console.log("Seeding database...");
  const pwd = await hashPassword("DesiigneR.123");
  const user1 = await storage.createUser({
    username: "hajdeha",
    password: pwd,
  });
  const seedUser = async (username: string, passwordPlain: string) => {
    const existing = await storage.getUserByUsername(username);
    if (existing) return existing;
    return storage.createUser({
      username,
      password: await hashPassword(passwordPlain),
    });
  };
  const user2 = await seedUser("admin2", "password123");
  const user3 = await seedUser("admin3", "password123");
  const r1 = await storage.createRestaurant({
    userId: user1.id,
    name: "Test Restaurant Tetovë",
    slug: "test-restaurant-tetove",
    description: "Authentic local cuisine in the heart of Tetovo.",
    photoUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    website: "https://test-restaurant.mk",
    phoneNumber: "+389 44 123 456",
    location: "Rruga e Marshit, Tetovë 1200",
    latitude: 42.01,
    longitude: 20.97,
  });
  const r2 = await storage.createRestaurant({
    userId: user2.id,
    name: "Hajde Grill",
    slug: "hajde-grill",
    description: "Best grilled meats and traditional qebapa.",
    photoUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    website: "https://hajdegrill.mk",
    phoneNumber: "+389 44 234 567",
    location: "Bulevardi Iliria, Tetovë 1200",
    latitude: 42.008,
    longitude: 20.965,
  });
  const r3 = await storage.createRestaurant({
    userId: user3.id,
    name: "Cafe Hajde",
    slug: "cafe-hajde",
    description: "Premium coffee and delightful desserts.",
    photoUrl:
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    website: "https://cafehajde.mk",
    phoneNumber: "+389 44 345 678",
    location: "Sheshi Iliria, Tetovë 1200",
    latitude: 42.012,
    longitude: 20.972,
  });
  const items = [
    {
      restaurantId: r1.id,
      name: "Pizza Margherita",
      price: "500 DEN",
      category: "Food",
      description: "Tomato sauce, mozzarella, basil",
    },
    {
      restaurantId: r1.id,
      name: "Classic Burger",
      price: "350 DEN",
      category: "Food",
      description: "Beef patty, lettuce, tomato, house sauce",
    },
    {
      restaurantId: r1.id,
      name: "Coca-Cola",
      price: "100 DEN",
      category: "Drinks",
      description: "330ml can",
    },
    {
      restaurantId: r2.id,
      name: "Grilled Chicken",
      price: "450 DEN",
      category: "Mains",
      description: "Served with fries and salad",
    },
    {
      restaurantId: r2.id,
      name: "Qebapa (10 pcs)",
      price: "300 DEN",
      category: "Mains",
      description: "Traditional minced meat rolls with bread",
    },
    {
      restaurantId: r2.id,
      name: "Ayran",
      price: "60 DEN",
      category: "Drinks",
      description: "Refreshing yogurt drink",
    },
    {
      restaurantId: r3.id,
      name: "Espresso",
      price: "80 DEN",
      category: "Coffee",
      description: "Strong and rich",
    },
    {
      restaurantId: r3.id,
      name: "Cappuccino",
      price: "120 DEN",
      category: "Coffee",
      description: "Espresso with steamed milk foam",
    },
    {
      restaurantId: r3.id,
      name: "Cheesecake",
      price: "250 DEN",
      category: "Dessert",
      description: "New York style with berry topping",
    },
  ];
  for (let i = 0; i < items.length; i++) {
    await storage.createMenuItem({ ...items[i], sortOrder: i });
  }
  console.log("Database seeded successfully!");
}
