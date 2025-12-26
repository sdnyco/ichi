ALTER TABLE "place_profiles"
ADD COLUMN "is_availability_enabled" boolean DEFAULT false NOT NULL,
ADD COLUMN "availability_start_minutes" integer,
ADD COLUMN "availability_end_minutes" integer,
ADD COLUMN "availability_time_zone" text DEFAULT 'Europe/Berlin' NOT NULL;


