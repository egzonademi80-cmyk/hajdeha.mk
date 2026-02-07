import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { compare } from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isMatch = await compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Fixed: Changed userId to id and added username to match what /api/user expects
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    return res.status(200).json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({
        message: "Internal server error during login",
        error: String(error),
      });
  }
}
