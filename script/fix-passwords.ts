import { db } from "../server/db.js";
import { users } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function updatePasswords() {
  console.log("Updating passwords to bcrypt...");
  const allUsers = await db.select().from(users);
  
  for (const user of allUsers) {
    // Only update if not already bcrypt hashed
    if (!user.password.startsWith('$2b$')) {
      const hashedPassword = await bcrypt.hash("admin", 10);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
      console.log(`Updated password for user: ${user.username} to "admin"`);
    }
  }
  console.log("Password update complete.");
  process.exit(0);
}

updatePasswords().catch(console.error);
