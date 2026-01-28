import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertMenuItem } from "@shared/schema";

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: InsertMenuItem) => {
      const res = await fetch(api.menuItems.create.path, {
        method: api.menuItems.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create item");
      }
      
      return api.menuItems.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate the restaurant query to refresh the menu list
      // We need to know which restaurant this belongs to, which is in `variables.restaurantId`
      // But simpler is to just invalidate all restaurant-related queries or specific restaurant
      // Ideally we would invalidate queryKey: [api.restaurants.get.path, variables.restaurantId]
      // but since we might not have the exact path constructed here easily without importing buildUrl everywhere
      // we can do a broader invalidation or be specific if we pass the ID.
      // Let's assume the component refetches or we invalidate generic keys.
      // Since our useRestaurant uses the path + ID as key:
      queryClient.invalidateQueries({ queryKey: [api.restaurants.get.path] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertMenuItem>) => {
      const url = buildUrl(api.menuItems.update.path, { id });
      const res = await fetch(url, {
        method: api.menuItems.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update item");
      return api.menuItems.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.restaurants.get.path] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.menuItems.delete.path, { id });
      const res = await fetch(url, {
        method: api.menuItems.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete item");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.restaurants.get.path] });
    },
  });
}
