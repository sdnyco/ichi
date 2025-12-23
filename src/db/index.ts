import { drizzle } from "drizzle-orm/node-postgres"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import { getEnv } from "@/lib/env"
import * as schema from "./schema"

const connectionString = getEnv("DATABASE_URL")

const globalStore = globalThis as typeof globalThis & {
  __drizzleDb?: NodePgDatabase<typeof schema>
  __pgPool?: Pool
}

const pool = globalStore.__pgPool ?? new Pool({ connectionString })

if (process.env.NODE_ENV !== "production") {
  globalStore.__pgPool = pool
}

export const db: NodePgDatabase<typeof schema> =
  globalStore.__drizzleDb ?? drizzle(pool, { schema })

if (process.env.NODE_ENV !== "production") {
  globalStore.__drizzleDb = db
}
