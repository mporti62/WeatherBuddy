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

// Meeting Points Schema
export const meetingPoints = pgTable("meeting_points", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  zipCode: text("zip_code").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  address: text("address"),
  date: timestamp("date"),
  time: text("time"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("active").notNull(),
  maxParticipants: integer("max_participants"),
  category: text("category"),
  contactInfo: text("contact_info"),
});

export const insertMeetingPointSchema = createInsertSchema(meetingPoints).pick({
  name: true,
  description: true,
  zipCode: true,
  latitude: true,
  longitude: true,
  address: true,
  date: true,
  time: true,
  createdBy: true,
  maxParticipants: true,
  category: true,
  contactInfo: true,
});

export type InsertMeetingPoint = z.infer<typeof insertMeetingPointSchema>;
export type MeetingPoint = typeof meetingPoints.$inferSelect;

// Ubicaciones en tiempo real Schema
export const liveLocations = pgTable("live_locations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Identificador único del usuario (puede ser generado)
  userName: text("user_name").notNull(), // Nombre público del usuario
  meetingPointId: integer("meeting_point_id").references(() => meetingPoints.id),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  status: text("status").default("active").notNull(), // active, inactive
  userAvatar: text("user_avatar"), // URL opcional para un avatar
  device: text("device"), // Información del dispositivo
});

export const insertLiveLocationSchema = createInsertSchema(liveLocations).pick({
  userId: true,
  userName: true,
  meetingPointId: true,
  latitude: true,
  longitude: true,
  userAvatar: true,
  device: true,
});

export type InsertLiveLocation = z.infer<typeof insertLiveLocationSchema>;
export type LiveLocation = typeof liveLocations.$inferSelect;
