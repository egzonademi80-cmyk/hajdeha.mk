import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { setToken, removeToken, getToken } from "@/lib/queryClient";

export type LoginInput = {
  username: string;
  password: string;
};

export function useUser() {
  return useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const token = getToken();

      if (!token) {
        return null;
      }

      const res = await fetch("/api/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401 || !res.ok) {
        removeToken();
        return null;
      }

      const data = await res.json();
      return data.user;
    },
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (credentials: LoginInput) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Login failed");
      }

      return res.json();
    },
    onSuccess: (data) => {
      if (data.token) {
        setToken(data.token);
        // Store in localStorage for persistence across page reloads
        localStorage.setItem("hajdeha-token", data.token);
      }
      queryClient.setQueryData(["/api/user"], data.user);
      setLocation("/admin/dashboard");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async () => {
      await fetch("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      removeToken();
      queryClient.setQueryData(["/api/user"], null);
      setLocation("/");
    },
  });
}
