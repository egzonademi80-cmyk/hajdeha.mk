import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react({
      // ✅ Use automatic JSX runtime (smaller bundle)
      jsxRuntime: "automatic",
      // ✅ Only include dev tools in development
      babel: {
        plugins:
          process.env.NODE_ENV === "production"
            ? ["babel-plugin-transform-remove-console"]
            : [],
      },
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
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,

    // ✅ Optimize minification
    minify: "esbuild", // Faster than terser, still good compression

    // ✅ Generate sourcemaps only in development
    sourcemap: process.env.NODE_ENV === "development",

    // ✅ Optimize chunk size
    chunkSizeWarningLimit: 1000,

    // ✅ Code splitting for better caching
    rollupOptions: {
      output: {
        // Split vendor code into separate chunks
        manualChunks: {
          // React core (changes rarely)
          "react-core": ["react", "react-dom"],

          // Routing (changes rarely)
          router: ["wouter"],

          // Data fetching (changes rarely)
          query: ["@tanstack/react-query"],

          // UI libraries (changes rarely)
          "ui-icons": ["lucide-react"],
          "ui-motion": ["framer-motion"],
        },

        // ✅ Better file naming for caching
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
      },
    },

    // ✅ Target modern browsers (smaller bundle)
    target: "es2020",

    // ✅ Optimize CSS
    cssCodeSplit: true,
    cssMinify: true,
  },

  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // ✅ Enable HMR for faster dev experience
    hmr: {
      overlay: true,
    },
  },

    // ✅ Optimize dependency pre-bundling
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
    // ✅ No longer excluding leaflet for faster startup
  },

  // ✅ Enable esbuild for faster builds
  esbuild: {
    // Remove console.log in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],

    // Optimize for modern syntax
    target: "es2020",
  },
});
