import { db } from "./_db";
import { users } from "../shared/schema";

export default async function handler(_req: any, res: any) {
  try {
    const allUsers = await db.select().from(users);
    res.status(200).json(allUsers);
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "DB Error" });
  }
}
