import { db } from "@/db"
import { users } from "@/db/schema"

export class AccountDisabledError extends Error {
  constructor() {
    super("account_disabled")
  }
}

export async function ensureUserNotBanned(userId: string) {
  const record = await db.query.users.findFirst({
    where: (tbl, { eq: whereEq }) => whereEq(tbl.id, userId),
    columns: {
      id: true,
      isBanned: true,
    },
  })

  if (record?.isBanned) {
    throw new AccountDisabledError()
  }
}

export async function touchUserLastSeen(userId: string, when = new Date()) {
  await db
    .insert(users)
    .values({
      id: userId,
      lastSeenAt: when,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { lastSeenAt: when },
    })
}

export type UserModerationState = Pick<
  typeof users.$inferSelect,
  "id" | "isBanned" | "bannedAt" | "banReason" | "lastSeenAt" | "createdAt"
>

export async function getUserModerationState(
  userId: string,
): Promise<UserModerationState | null> {
  const record = await db.query.users.findFirst({
    where: (tbl, { eq: whereEq }) => whereEq(tbl.id, userId),
    columns: {
      id: true,
      createdAt: true,
      lastSeenAt: true,
      isBanned: true,
      bannedAt: true,
      banReason: true,
    },
  })

  return record ?? null
}

