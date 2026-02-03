import express, { type Express } from "express";
import fs from "fs";
import path from "path";
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }
  // Serve sitemap with correct MIME type
  app.get("/sitemap.xml", (_req, res) => {
    res.setHeader("Content-Type", "application/xml");
    const sitemapPath = path.join(distPath, "sitemap.xml");
    if (fs.existsSync(sitemapPath)) {
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send("Sitemap not found");
    }
  });

  // Serve robots.txt with correct MIME type
  app.get("/robots.txt", (_req, res) => {
    res.setHeader("Content-Type", "text/plain");
    const robotsPath = path.join(distPath, "robots.txt");
    if (fs.existsSync(robotsPath)) {
      res.sendFile(robotsPath);
    } else {
      res.status(404).send("Robots.txt not found");
    }
  });

  // Serve PWA manifest with correct MIME type
  app.get("/manifest.json", (_req, res) => {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifestPath = path.join(distPath, "manifest.json");
    if (fs.existsSync(manifestPath)) {
      res.sendFile(manifestPath);
    } else {
      res.status(404).send("Manifest not found");
    }
  });
  // Serve service worker with correct headers
  app.get("/service-worker.js", (_req, res) => {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Service-Worker-Allowed", "/");
    res.setHeader("Cache-Control", "no-cache");
    const swPath = path.join(distPath, "service-worker.js");
    if (fs.existsSync(swPath)) {
      res.sendFile(swPath);
    } else {
      res.status(404).send("Service worker not found");
    }
  });
  // Serve static files with proper caching
  app.use(
    express.static(distPath, {
      maxAge: "30d",
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );
  // SPA fallback - serve index.html for all other routes
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
