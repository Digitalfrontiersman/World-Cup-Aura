import { pgTable, text, jsonb, timestamp, integer, serial } from "drizzle-orm/pg-core";

export const auraCardsTable = pgTable("aura_cards", {
  slug: text("slug").primaryKey(),
  card: jsonb("card").notNull(),
  imageDataUrl: text("image_data_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  editionNumber: serial("edition_number").notNull().unique(),
  rarity: text("rarity").notNull().default("Core"),
});

export const rarityQuotasTable = pgTable("rarity_quotas", {
  tier: text("tier").primaryKey(),
  quota: integer("quota").notNull(),
  issued: integer("issued").notNull().default(0),
});

export const cardVotesTable = pgTable("card_votes", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  vote: integer("vote").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cardCommentsTable = pgTable("card_comments", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  displayName: text("display_name").notNull().default("Anonymous"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuraCardRow = typeof auraCardsTable.$inferSelect;
export type InsertAuraCard = typeof auraCardsTable.$inferInsert;
export type RarityQuotaRow = typeof rarityQuotasTable.$inferSelect;
export type CardVoteRow = typeof cardVotesTable.$inferSelect;
export type CardCommentRow = typeof cardCommentsTable.$inferSelect;
