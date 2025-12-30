import { relations } from "drizzle-orm"
import {
  boolean,
  index,
  jsonb,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import type { AvailabilityWeekly } from "@/types/availability"

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
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  isBanned: boolean("is_banned").notNull().default(false),
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  banReason: text("ban_reason"),
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
    isAnchored: boolean("is_anchored").notNull().default(false),
    lastHooks: jsonb("last_hooks").$type<string[] | null>(),
    isAvailabilityEnabled: boolean("is_availability_enabled")
      .notNull()
      .default(false),
    availabilityTimeZone: text("availability_time_zone")
      .notNull()
      .default("Europe/Berlin"),
    availabilityWeekly: jsonb("availability_weekly").$type<
      AvailabilityWeekly | null
    >(),
    contactEmail: text("contact_email"),
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
    durationMinutes: integer("duration_minutes"),
    mood: text("mood").notNull(),
    recognizabilityHint: text("recognizability_hint"),
    hooks: jsonb("hooks").$type<string[] | null>(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const pingEvents = pgTable(
  "ping_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id),
    senderCheckInId: uuid("sender_check_in_id")
      .notNull()
      .references(() => checkIns.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    dayKey: text("day_key").notNull(),
    maxRecipients: integer("max_recipients").notNull(),
    status: text("status").notNull().default("sent"),
  },
  (table) => ({
    placeDayUnique: uniqueIndex("ping_events_place_day_unique").on(
      table.placeId,
      table.dayKey,
    ),
    placeIdx: index("ping_events_place_idx").on(table.placeId),
    senderIdx: index("ping_events_sender_idx").on(table.senderUserId),
  }),
)

export const pingRecipients = pgTable(
  "ping_recipients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pingEventId: uuid("ping_event_id")
      .notNull()
      .references(() => pingEvents.id),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => users.id),
    recipientEmail: text("recipient_email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueRecipientPerEvent: uniqueIndex(
      "ping_recipients_event_recipient_unique",
    ).on(table.pingEventId, table.recipientUserId),
    recipientIdx: index("ping_recipients_recipient_idx").on(
      table.recipientUserId,
      table.createdAt,
    ),
  }),
)

export const userTraits = pgTable("user_traits", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  ageBand: text("age_band"),
  heightCm: integer("height_cm"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

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

export const userRelations = relations(users, ({ many, one }) => ({
  profiles: many(placeProfiles),
  checkIns: many(checkIns),
  pingEvents: many(pingEvents),
  pingRecipients: many(pingRecipients),
  traits: one(userTraits, {
    fields: [users.id],
    references: [userTraits.userId],
  }),
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

export const checkInRelations = relations(checkIns, ({ one, many }) => ({
  place: one(places, {
    fields: [checkIns.placeId],
    references: [places.id],
  }),
  user: one(users, {
    fields: [checkIns.userId],
    references: [users.id],
  }),
  pingEvents: many(pingEvents),
}))

export const userTraitRelations = relations(userTraits, ({ one }) => ({
  user: one(users, {
    fields: [userTraits.userId],
    references: [users.id],
  }),
}))

export const pingEventRelations = relations(pingEvents, ({ one, many }) => ({
  place: one(places, {
    fields: [pingEvents.placeId],
    references: [places.id],
  }),
  sender: one(users, {
    fields: [pingEvents.senderUserId],
    references: [users.id],
  }),
  senderCheckIn: one(checkIns, {
    fields: [pingEvents.senderCheckInId],
    references: [checkIns.id],
  }),
  recipients: many(pingRecipients),
}))

export const pingRecipientRelations = relations(pingRecipients, ({ one }) => ({
  event: one(pingEvents, {
    fields: [pingRecipients.pingEventId],
    references: [pingEvents.id],
  }),
  recipient: one(users, {
    fields: [pingRecipients.recipientUserId],
    references: [users.id],
  }),
}))

export const userBlocks = pgTable(
  "user_blocks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    blockerUserId: uuid("blocker_user_id")
      .notNull()
      .references(() => users.id),
    blockedUserId: uuid("blocked_user_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniquePair: uniqueIndex("user_blocks_unique_pair").on(
      table.blockerUserId,
      table.blockedUserId,
    ),
    blockerIdx: index("user_blocks_blocker_idx").on(table.blockerUserId),
    blockedIdx: index("user_blocks_blocked_idx").on(table.blockedUserId),
  }),
)

export const userReports = pgTable(
  "user_reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => users.id),
    reportedUserId: uuid("reported_user_id")
      .notNull()
      .references(() => users.id),
    placeId: uuid("place_id").references(() => places.id),
    portalId: uuid("portal_id").references(() => portals.id),
    checkInId: uuid("check_in_id").references(() => checkIns.id),
    reasonCode: text("reason_code").notNull(),
    freeText: text("free_text"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    status: text("status").notNull().default("new"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedBy: text("resolved_by"),
  },
  (table) => ({
    reporterIdx: index("user_reports_reporter_idx").on(table.reporterUserId),
    reportedIdx: index("user_reports_reported_idx").on(table.reportedUserId),
    createdIdx: index("user_reports_created_idx").on(table.createdAt),
  }),
)

export const errorEvents = pgTable("error_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  source: text("source").notNull(),
  route: text("route"),
  message: text("message").notNull(),
  detail: jsonb("detail"),
})

export type UserBlock = typeof userBlocks.$inferSelect
export type UserReport = typeof userReports.$inferSelect
export type ErrorEvent = typeof errorEvents.$inferSelect

export type Place = typeof places.$inferSelect
export type Portal = typeof portals.$inferSelect
export type User = typeof users.$inferSelect
export type PlaceProfile = typeof placeProfiles.$inferSelect
export type CheckIn = typeof checkIns.$inferSelect
export type UserTrait = typeof userTraits.$inferSelect
export type PingEvent = typeof pingEvents.$inferSelect
export type PingRecipient = typeof pingRecipients.$inferSelect
