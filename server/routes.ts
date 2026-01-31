import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import { api } from "@shared/routes";
import { z } from "zod";

import { db } from "./db.js";
import { restaurants as restaurantsTable } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const { hashPassword } = setupAuth(app);

  // === AUTH ROUTES ===

  app.post(api.auth.login.path, (req, res, next) => {
    // Validate input first
    const validation = api.auth.login.input.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json(user);
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
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // === RESTAURANT ROUTES ===

  // Public: List all restaurants
  app.get(api.restaurants.listAll.path, async (_req, res) => {
    const restaurants = await db.select().from(restaurantsTable);
    const enriched = await Promise.all(restaurants.map(async (r) => {
      const menuItems = await storage.getMenuItems(r.id);
      return { ...r, menuItems };
    }));
    res.json(enriched);
  });

  // Public: Get Restaurant by Slug
  app.get(api.restaurants.getBySlug.path, async (req, res) => {
    const slug = req.params.slug;
    const restaurant = await storage.getRestaurantBySlug(slug);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const menuItems = await storage.getMenuItems(restaurant.id);
    res.json({ ...restaurant, menuItems });
  });

  // Admin: List Owned Restaurants
  app.get(api.restaurants.list.path, async (req, res) => {
    const restaurants = await storage.getAllRestaurants();
    res.json(restaurants);
  });

  // Admin: Get specific restaurant for editing
  app.get(api.restaurants.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(id);

    if (!restaurant) return res.status(404).json({ message: "Not found" });

    const menuItems = await storage.getMenuItems(id);
    res.json({ ...restaurant, menuItems });
  });

  // Admin: Update Restaurant
  app.put(api.restaurants.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(id);

    if (!restaurant) return res.status(404).json({ message: "Not found" });

    const input = api.restaurants.update.input.parse(req.body);
    const updated = await storage.updateRestaurant(id, input);
    res.json(updated);
  });

  // Admin: Create Restaurant
  app.post(api.restaurants.create.path, async (req, res) => {
    try {
      console.log("Creating restaurant. Body:", req.body);
      
      const input = api.restaurants.create.input.parse(req.body);
      
      // Get the current logged in user from session
      // Passport puts the user object in req.user
      // Fallback to userId 1 for now if session is not persisting across Vercel requests
      const user = req.user as any;
      const userId = user?.id || 1;
      
      console.log("Using userId:", userId);

      const restaurantData = { 
        ...input, 
        userId: userId,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null
      };
      
      console.log("Saving restaurant to DB:", restaurantData);
      const restaurant = await storage.createRestaurant(restaurantData);
      res.status(201).json(restaurant);
    } catch (error: any) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ 
        message: error.message || "Failed to create restaurant",
        details: error.toString()
      });
    }
  });

  // Admin: Delete Restaurant
  app.delete(api.restaurants.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(id);
    if (!restaurant) return res.status(404).json({ message: "Not found" });
    await storage.deleteRestaurant(id);
    res.sendStatus(204);
  });

  // === MENU ITEM ROUTES ===

  app.post(api.menuItems.create.path, async (req, res) => {
    const input = api.menuItems.create.input.parse(req.body);
    const restaurant = await storage.getRestaurant(input.restaurantId);

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

    const item = await storage.createMenuItem(input);
    res.status(201).json(item);
  });

  app.put(api.menuItems.update.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.getMenuItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const restaurant = await storage.getRestaurant(item.restaurantId);

    const input = api.menuItems.update.input.parse(req.body);
    const updated = await storage.updateMenuItem(id, input);
    res.json(updated);
  });

  app.delete(api.menuItems.delete.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const item = await storage.getMenuItem(id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const restaurant = await storage.getRestaurant(item.restaurantId);

    await storage.deleteMenuItem(id);
    res.sendStatus(204);
  });

  // === SEED DATA ===
  await seedDatabase(hashPassword);

  return httpServer;
}

import passport from "passport";

async function seedDatabase(hashPassword: (pwd: string) => Promise<string>) {
  const admin = await storage.getUserByUsername("hajdeha");
  if (admin) return; // Already seeded

  console.log("Seeding database...");

  // Create Users (Admins)
  const pwd = await hashPassword("DesiigneR.123");
  
  const user1 = await storage.createUser({ username: "hajdeha", password: pwd });

  // For secondary users, check if they exist first to avoid unique constraint errors
  const seedUser = async (username: string, passwordPlain: string) => {
    const existing = await storage.getUserByUsername(username);
    if (existing) return existing;
    return storage.createUser({ username, password: await hashPassword(passwordPlain) });
  };

  const user2 = await seedUser("admin2", "password123");
  const user3 = await seedUser("admin3", "password123");

  // Restaurant 1: Pizza, Burger, Coca-Cola
  const r1 = await storage.createRestaurant({
    userId: user1.id,
    name: "Test Restaurant Tetovë",
    slug: "test-restaurant-tetove",
    description: "Authentic local cuisine in the heart of Tetovo.",
    photoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
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
    photoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    website: "https://cafehajde.mk",
    phoneNumber: "+389 44 345 678",
    location: "Sheshi Iliria, Tetovë 1200",
    latitude: 42.012,
    longitude: 20.972,
  });

  // Create Menu Items
  // Restaurant 1: Pizza, Burger, Coca-Cola
  await storage.createMenuItem({ restaurantId: r1.id, name: "Pizza Margherita", price: "500 DEN", category: "Food", description: "Tomato sauce, mozzarella, basil" });
  await storage.createMenuItem({ restaurantId: r1.id, name: "Classic Burger", price: "350 DEN", category: "Food", description: "Beef patty, lettuce, tomato, house sauce" });
  await storage.createMenuItem({ restaurantId: r1.id, name: "Coca-Cola", price: "100 DEN", category: "Drinks", description: "330ml can" });

  // Restaurant 2: Grilled Chicken, Qebapa, Ayran
  await storage.createMenuItem({ restaurantId: r2.id, name: "Grilled Chicken", price: "450 DEN", category: "Mains", description: "Served with fries and salad" });
  await storage.createMenuItem({ restaurantId: r2.id, name: "Qebapa (10 pcs)", price: "300 DEN", category: "Mains", description: "Traditional minced meat rolls with bread" });
  await storage.createMenuItem({ restaurantId: r2.id, name: "Ayran", price: "60 DEN", category: "Drinks", description: "Refreshing yogurt drink" });

  // Restaurant 3: Espresso, Cappuccino, Cheesecake
  await storage.createMenuItem({ restaurantId: r3.id, name: "Espresso", price: "80 DEN", category: "Coffee", description: "Strong and rich" });
  await storage.createMenuItem({ restaurantId: r3.id, name: "Cappuccino", price: "120 DEN", category: "Coffee", description: "Espresso with steamed milk foam" });
  await storage.createMenuItem({ restaurantId: r3.id, name: "Cheesecake", price: "250 DEN", category: "Dessert", description: "New York style with berry topping" });

  console.log("Database seeded successfully!");
}
