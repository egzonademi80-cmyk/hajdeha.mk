import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      babel: { plugins: [] },
    }),
    runtimeErrorOverlay(),

    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },

  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),

  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: "esbuild",
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // React core — must be first
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "react-core";
          }
          // Router
          if (id.includes("node_modules/wouter")) {
            return "router";
          }
          // Data fetching
          if (id.includes("node_modules/@tanstack")) {
            return "query";
          }
          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "ui-icons";
          }
          // Animation
          if (id.includes("node_modules/framer-motion")) {
            return "ui-motion";
          }
          // Radix UI
          if (id.includes("node_modules/@radix-ui")) {
            return "ui-radix";
          }
          // Map — lazy loaded
          if (id.includes("node_modules/leaflet")) {
            return "map";
          }
          // Canvas / screenshot
          if (id.includes("node_modules/html2canvas")) {
            return "html2canvas";
          }
          // DnD
          if (id.includes("node_modules/@dnd-kit")) {
            return "dnd";
          }
          // NOTE: recharts, d3, victory intentionally NOT split — circular deps cause ReferenceError
          // NOTE: zod, react-hook-form intentionally NOT split — shared across chunks
        },
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },
    target: "es2020",
    cssCodeSplit: true,
    cssMinify: true,
  },

  server: {
    fs: { strict: true, deny: ["**/.*"] },
    hmr: { overlay: true },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "wouter",
      "@tanstack/react-query",
      "lucide-react",
      "framer-motion",
      "leaflet",
    ],
  },

  esbuild: {
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    target: "es2020",
  },
});
