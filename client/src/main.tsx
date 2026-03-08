import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── Inline Service Worker (works on Vercel static hosting) ──
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  const SW_CODE = `
const CACHE_NAME = "hajdeha-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.protocol === "chrome-extension:") return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          const cached = await cache.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ offline: true, message: "No internet connection" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return new Response("", { status: 404 });
        }
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/"))
      )
  );
});
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = JSON.parse(event.data.text());
    event.waitUntil(
      self.registration.showNotification(data.title || "HAJDE HA", {
        body: data.body || "",
        icon: data.icon || "/icon-192.png",
        badge: "/icon-192.png",
        data: { url: data.url || "/" },
      })
    );
  } catch {}
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
`;

  // Subscribe user to push notifications
  async function subscribeToPush(reg: ServiceWorkerRegistration) {
    try {
      // Get VAPID public key from server
      const res = await fetch("/api/push/vapid-public-key");
      if (!res.ok) return;
      const { key } = await res.json();
      if (!key) return;

      // Check existing subscription
      const existing = await reg.pushManager.getSubscription();
      if (existing) return; // Already subscribed

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // Subscribe
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      // Send to server
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      console.log("✅ Push subscription saved");
    } catch (err) {
      console.warn("Push subscription failed:", err);
    }
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i)
      outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  window.addEventListener("load", () => {
    try {
      const blob = new Blob([SW_CODE], { type: "application/javascript" });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .then((reg) => {
          console.log("✅ PWA ServiceWorker registered");
          setInterval(() => reg.update(), 60_000);
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                window.location.reload();
              }
            });
          });

          // Subscribe to push notifications
          subscribeToPush(reg);
        })
        .catch((err) => {
          console.warn("Blob SW failed, trying file SW:", err);
          navigator.serviceWorker
            .register("/service-worker.js")
            .then(() => console.log("✅ File SW registered"))
            .catch(() => console.log("SW not available"));
        });
    } catch (err) {
      console.log("SW not supported");
    }
  });
}

// ── Root ──
function Root() {
  return <App />;
}

createRoot(document.getElementById("root")!).render(<Root />);
