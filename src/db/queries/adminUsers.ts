import { desc, eq } from "drizzle-orm"

import { db } from "@/db"
import { users } from "@/db/schema"
import { expireActiveCheckinsForUser } from "@/db/queries/checkins"

type BanParams = {
  userId: string
  isBanned: boolean
  banReason?: string | null
}

export type AdminUserRecord = {
  id: string
  createdAt: Date
  lastSeenAt: Date | null
  isBanned: boolean
  banReason: string | null
  bannedAt: Date | null
}

export async function listRecentUsers(limit = 20): Promise<AdminUserRecord[]> {
  return db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      isBanned: users.isBanned,
      banReason: users.banReason,
      bannedAt: users.bannedAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(limit)
}

export async function getUserById(
  userId: string,
): Promise<AdminUserRecord | null> {
  const [record] = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
      isBanned: users.isBanned,
      banReason: users.banReason,
      bannedAt: users.bannedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  return record ?? null
}

export async function setUserBanState({
  userId,
  isBanned,
  banReason,
}: BanParams) {
  const now = new Date()
  const [updated] = await db
    .update(users)
    .set({
      isBanned,
      banReason: banReason?.trim() ? banReason.trim() : null,
      bannedAt: isBanned ? now : null,
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      isBanned: users.isBanned,
      banReason: users.banReason,
      bannedAt: users.bannedAt,
      createdAt: users.createdAt,
      lastSeenAt: users.lastSeenAt,
    })

  if (isBanned) {
    await expireActiveCheckinsForUser(userId, now)
  }

  return updated
}

