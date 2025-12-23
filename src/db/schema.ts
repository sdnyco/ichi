import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

export const places = pgTable(
  "places",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    addressText: text("address_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    slugUnique: uniqueIndex("places_slug_unique").on(table.slug),
  }),
)

export const portals = pgTable(
  "portals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    codeUnique: uniqueIndex("portals_code_unique").on(table.code),
    placeIdx: index("portals_place_id_index").on(table.placeId),
  }),
)

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const placeProfiles = pgTable(
  "place_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    alias: text("alias").notNull(),
    aliasGenerated: boolean("alias_generated").notNull().default(false),
    anchored: boolean("anchored").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userPlaceUnique: uniqueIndex("place_profiles_user_place_unique").on(
      table.userId,
      table.placeId,
    ),
  }),
)

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    placeExpiresIdx: index("check_ins_place_expires_index").on(
      table.placeId,
      table.expiresAt,
    ),
  }),
)

export const placeRelations = relations(places, ({ many }) => ({
  portals: many(portals),
  profiles: many(placeProfiles),
  checkIns: many(checkIns),
}))

export const portalRelations = relations(portals, ({ one }) => ({
  place: one(places, {
    fields: [portals.placeId],
    references: [places.id],
  }),
}))

export const userRelations = relations(users, ({ many }) => ({
  profiles: many(placeProfiles),
  checkIns: many(checkIns),
}))

export const placeProfileRelations = relations(placeProfiles, ({ one }) => ({
  place: one(places, {
    fields: [placeProfiles.placeId],
    references: [places.id],
  }),
  user: one(users, {
    fields: [placeProfiles.userId],
    references: [users.id],
  }),
}))

export const checkInRelations = relations(checkIns, ({ one }) => ({
  place: one(places, {
    fields: [checkIns.placeId],
    references: [places.id],
  }),
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
}))

export type Place = typeof places.$inferSelect
export type Portal = typeof portals.$inferSelect
export type User = typeof users.$inferSelect
export type PlaceProfile = typeof placeProfiles.$inferSelect
export type CheckIn = typeof checkIns.$inferSelect
