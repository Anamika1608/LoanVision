import { eq } from "drizzle-orm";
import db from "src/db";
import { user } from "src/model/user";
import hashPassword from "src/utils/hashPassword";

const ADMIN_EMAIL = "admin@loanvision.ai";
const ADMIN_PASSWORD = "Admin@1234";

async function seedAdmin() {
  const [existing] = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL)).limit(1);

  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    process.exit(0);
  }

  const hashedPassword = await hashPassword(ADMIN_PASSWORD);

  await db.insert(user).values({
    firstName: "Admin",
    lastName: "User",
    email: ADMIN_EMAIL,
    password: hashedPassword,
    phone: "0000000000",
    role: "admin",
  });

  console.log(`Admin user created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
