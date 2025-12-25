ALTER TABLE "users"
ADD COLUMN "last_seen_at" timestamp with time zone,
ADD COLUMN "is_banned" boolean DEFAULT false NOT NULL,
ADD COLUMN "banned_at" timestamp with time zone,
ADD COLUMN "ban_reason" text;
--> statement-breakpoint
ALTER TABLE "user_reports"
ADD COLUMN "status" text DEFAULT 'new' NOT NULL,
ADD COLUMN "resolved_at" timestamp with time zone,
ADD COLUMN "resolved_by" text;

