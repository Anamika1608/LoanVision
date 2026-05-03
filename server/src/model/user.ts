import { InferSelectModel } from "drizzle-orm";
import { pgTable, text, varchar, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "./enums";

export const user = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  firstName: varchar("first_name", { length: 30 }).notNull(),
  lastName: varchar("last_name", { length: 30 }).notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  phone: varchar("phone", { length: 10 }).unique(),
  role: userRoleEnum("role").notNull().default("user"),
});

export type User = InferSelectModel<typeof user>;
