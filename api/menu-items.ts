import { db } from "./_db";
import { menuItems } from "../shared/schema";

export default async function handler(_req: any, res: any) {
  try {
    const allMenuItems = await db.select().from(menuItems);
    res.status(200).json(allMenuItems);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
