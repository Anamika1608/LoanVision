import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { campaignChannelEnum } from "./enums";

export const campaign = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  channel: campaignChannelEnum("channel").notNull(),
  productType: varchar("product_type", { length: 50 }).notNull(),
  maxUses: integer("max_uses").notNull(),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow()
});

export type Campaign = InferSelectModel<typeof campaign>;
