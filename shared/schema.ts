import { pgTable, text, serial, integer, boolean, doublePrecision, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Location Schema
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  zipCode: text("zip_code").notNull().unique(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).pick({
  zipCode: true,
  city: true,
  state: true,
  latitude: true,
  longitude: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// User Favorite Schema
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  zipCode: text("zip_code").notNull(),
  label: text("label"),
  isDefault: boolean("is_default").default(false),
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  zipCode: true,
  label: true,
  isDefault: true,
});

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;
