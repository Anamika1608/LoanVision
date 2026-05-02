import { InferSelectModel } from "drizzle-orm";
import { pgTable, uuid, varchar, decimal, timestamp, jsonb } from "drizzle-orm/pg-core";
import { user } from "./user";
import { sessionStatusEnum } from "./enums";

export const session = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => user.id),
  campaignId: varchar("campaign_id", { length: 20 }),
  status: sessionStatusEnum("status").notNull().default("pending"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  geoLatitude: decimal("geo_latitude", { precision: 10, scale: 7 }),
  geoLongitude: decimal("geo_longitude", { precision: 10, scale: 7 }),
  declaredCity: varchar("declared_city", { length: 100 }),
  deviceInfo: jsonb("device_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export type Session = InferSelectModel<typeof session>;
