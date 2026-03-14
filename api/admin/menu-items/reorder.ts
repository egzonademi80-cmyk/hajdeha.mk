import { VercelRequest, VercelResponse } from "@vercel/node";
import { db } from "../../../server/db.js";
import { menuItems } from "../../../shared/schema.js";
import { eq } from "drizzle-orm";
import { verifyToken, unauthorized, methodNotAllowed } from "../auth.js";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = verifyToken(req);
  if (!user) return unauthorized(res);
  if (req.method !== "POST") return methodNotAllowed(res);

  try {
    const { items, restaurantId } = req.body as {
      items: { id: number; sortOrder: number }[];
      restaurantId: number;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required" });
    }

    await Promise.all(
      items.map(({ id, sortOrder }) =>
        db.update(menuItems).set({ sortOrder }).where(eq(menuItems.id, id)),
      ),
    );

    // Broadcast real-time update
    await pusher.trigger(`restaurant-${restaurantId}`, "menu-reordered", {
      items,
      timestamp: Date.now(),
      userId: user.userId,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return res
      .status(500)
      .json({ message: "Failed to reorder", error: String(error) });
  }
}
