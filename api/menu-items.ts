import { db } from "../server/db";
import { menuItems } from "../shared/schema";

export default async function handler(req, res) {
  try {
    const allMenuItems = await db.select().from(menuItems);
    res.status(200).json(allMenuItems);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
