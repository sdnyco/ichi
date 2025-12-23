ALTER TABLE "check_ins" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "mood" text DEFAULT 'open' NOT NULL;--> statement-breakpoint
ALTER TABLE "check_ins" ADD COLUMN "recognizability_hint" text;