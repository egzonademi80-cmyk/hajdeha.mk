import { db } from "./db";
import { restaurants } from "../shared/schema";

export default async function handler(_req: any, res: any) {
  try {
    const allRestaurants = await db.select().from(restaurants);
    res.status(200).json(allRestaurants);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
