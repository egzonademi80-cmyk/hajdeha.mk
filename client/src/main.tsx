import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// ── Inline Service Worker (works on Vercel static hosting) ──
// Instead of fetching /service-worker.js (which Vercel intercepts),
// we create the SW as a Blob URL — no external file needed.
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

  // API calls — network first, fallback to cache (offline support)
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

  // Images — cache first
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

  // HTML + JS + CSS — network first, fallback to cache
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
`;

  window.addEventListener("load", () => {
    try {
      // Create SW from Blob — bypasses Vercel's catch-all route
      const blob = new Blob([SW_CODE], { type: "application/javascript" });
      const swUrl = URL.createObjectURL(blob);

      navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .then((reg) => {
          console.log("✅ PWA ServiceWorker registered");

          // Check for updates every 60 seconds
          setInterval(() => reg.update(), 60_000);

          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available — reload silently
                window.location.reload();
              }
            });
          });
        })
        .catch((err) => {
          // Blob SW failed (Firefox doesn't support it) — fallback to file
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

createRoot(document.getElementById("root")!).render(<App />);
