import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

// Define tables directly in this file for Vercel
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const restaurants = pgTable(
  "restaurants",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    descriptionAl: text("description_al"),
    descriptionMk: text("description_mk"),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    photoUrl: text("photo_url"),
    website: text("website"),
    phoneNumber: text("phone_number"),
    location: text("location"),
    openingTime: text("opening_time").default("08:00"),
    closingTime: text("closing_time").default("22:00"),
    active: boolean("active").default(true).notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
  },
  (table) => {
    return {
      slugIdx: index("slug_idx").on(table.slug),
    };
  },
);

export const menuItems = pgTable(
  "menu_items",
  {
    id: serial("id").primaryKey(),
    restaurantId: integer("restaurant_id")
      .notNull()
      .references(() => restaurants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    nameAl: text("name_al"),
    nameMk: text("name_mk"),
    description: text("description"),
    descriptionAl: text("description_al"),
    descriptionMk: text("description_mk"),
    price: text("price").notNull(),
    category: text("category").notNull().default("Main"),
    imageUrl: text("image_url"),
    active: boolean("active").default(true).notNull(),
    isVegetarian: boolean("is_vegetarian").default(false).notNull(),
    isVegan: boolean("is_vegan").default(false).notNull(),
    isGlutenFree: boolean("is_gluten_free").default(false).notNull(),
  },
  (table) => {
    return {
      restaurantIdIdx: index("restaurant_id_idx").on(table.restaurantId),
    };
  },
);

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, {
  schema: { users, restaurants, menuItems },
});
