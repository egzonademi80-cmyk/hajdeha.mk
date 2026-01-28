import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),

      // ✅ OPTIMIZED: Cache public data for 5 minutes (reduces server load)
      staleTime: 5 * 60 * 1000, // Changed from Infinity

      // ✅ OPTIMIZED: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously cacheTime

      // ✅ Keep these as they are (good defaults)
      refetchInterval: false,
      refetchOnWindowFocus: false,

      // ✅ OPTIMIZED: Retry once on network errors
      retry: 1, // Changed from false

      // ✅ NEW: Don't refetch on component mount if data is fresh
      refetchOnMount: false,

      // ✅ NEW: Refetch when browser comes back online
      refetchOnReconnect: true,
    },
    mutations: {
      retry: false,

      // ✅ NEW: Optimistic updates timeout
      gcTime: 5 * 60 * 1000,
    },
  },
});

// ✅ OPTIONAL: Add query key helpers for better type safety and caching
export const queryKeys = {
  restaurants: {
    all: ["/api/restaurants"] as const,
    bySlug: (slug: string) => ["/api/restaurants", slug] as const,
  },
  menuItems: {
    byRestaurant: (restaurantId: number) =>
      ["/api/restaurants", restaurantId, "menu"] as const,
  },
} as const;
