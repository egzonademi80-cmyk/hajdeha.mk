import { db } from "./db";
import { registerRoutes } from "./routes";
import express from "express";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

let routesRegistered = false;

export default async function handler(req: any, res: any) {
  if (!routesRegistered) {
    await registerRoutes(null as any, app);
    routesRegistered = true;
  }
  return app(req, res);
}