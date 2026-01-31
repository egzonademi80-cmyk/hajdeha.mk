import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import cookieSession from "cookie-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage.js";
import { User as SelectUser } from "@shared/schema";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [salt, key] = stored.split(":");
  const derivedKey = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(Buffer.from(key, "hex"), derivedKey);
}

export function setupAuth(app: Express) {
  app.use(
    cookieSession({
      name: "session",
      keys: [process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y"],
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    }),
  );

  // Fix for req.session.regenerate is not a function with cookie-session
  app.use((req, res, next) => {
    if (req.session && !req.session.regenerate) {
      req.session.regenerate = (cb: any) => cb();
    }
    if (req.session && !req.session.save) {
      req.session.save = (cb: any) => cb();
    }
    next();
  });

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
  }

  app.use(passport.initialize());
  app.use(passport.session());

  app.use((req, res, next) => {
    if (app.get("env") === "development" && !req.user) {
      storage.getUserByUsername("admin").then((user) => {
        if (user) {
          req.login(user, (err) => {
            if (err) return next(err);
            next();
          });
        } else {
          next();
        }
      });
    } else {
      next();
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Invalid username" });
        }

        const isValid = await comparePasswords(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid password" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    done(null, (user as SelectUser).id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  return { hashPassword };
}
