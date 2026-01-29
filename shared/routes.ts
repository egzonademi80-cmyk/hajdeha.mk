import { z } from "zod";
import {
  insertRestaurantSchema,
  insertMenuItemSchema,
  restaurants,
  menuItems,
  users,
} from "./schema";

// === ERROR SCHEMAS ===
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// === API CONTRACT ===
export const api = {
  auth: {
    login: {
      method: "POST" as const,
      path: "/api/login",
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(), // Returns user without password ideally, but for now full user object minus pwd handled in backend
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: "POST" as const,
      path: "/api/logout",
      responses: {
        200: z.void(),
      },
    },
    user: {
      method: "GET" as const,
      path: "/api/user",
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  restaurants: {
    // Public: List all restaurants for the home page
    listAll: {
      method: "GET" as const,
      path: "/api/restaurants",
      responses: {
        200: z.array(z.custom<typeof restaurants.$inferSelect>()),
      },
    },
    // Public endpoint for QR code access
    getBySlug: {
      method: "GET" as const,
      path: "/api/restaurants/:slug",
      responses: {
        200: z.custom<
          typeof restaurants.$inferSelect & {
            menuItems: (typeof menuItems.$inferSelect)[];
          }
        >(),
        404: errorSchemas.notFound,
      },
    },
    // Admin: List my restaurants
    list: {
      method: "GET" as const,
      path: "/api/admin/restaurants",
      responses: {
        200: z.array(z.custom<typeof restaurants.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    // Admin: Get specific restaurant details (for editing)
    get: {
      method: "GET" as const,
      path: "/api/admin/restaurants/:id",
      responses: {
        200: z.custom<
          typeof restaurants.$inferSelect & {
            menuItems: (typeof menuItems.$inferSelect)[];
          }
        >(),
        404: errorSchemas.notFound,
        403: errorSchemas.unauthorized,
      },
    },
    // Admin: Update restaurant info
    update: {
      method: "PUT" as const,
      path: "/api/admin/restaurants/:id",
      input: insertRestaurantSchema.partial(),
      responses: {
        200: z.custom<typeof restaurants.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    // Admin: Create restaurant
    create: {
      method: "POST" as const,
      path: "/api/admin/restaurants",
      input: insertRestaurantSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof restaurants.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    // Admin: Delete restaurant
    delete: {
      method: "DELETE" as const,
      path: "/api/admin/restaurants/:id",
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
  menuItems: {
    create: {
      method: "POST" as const,
      path: "/api/admin/menu-items",
      input: insertMenuItemSchema,
      responses: {
        201: z.custom<typeof menuItems.$inferSelect>(),
        403: errorSchemas.unauthorized,
        400: errorSchemas.validation,
      },
    },
    update: {
      method: "PUT" as const,
      path: "/api/admin/menu-items/:id",
      input: insertMenuItemSchema.partial(),
      responses: {
        200: z.custom<typeof menuItems.$inferSelect>(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/admin/menu-items/:id",
      responses: {
        204: z.void(),
        403: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(
  path: string,
  params?: Record<string, string | number>,
): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// === TYPE HELPERS ===
export type LoginInput = z.infer<typeof api.auth.login.input>;
export type RestaurantWithMenu = z.infer<
  (typeof api.restaurants.getBySlug.responses)[200]
>;
