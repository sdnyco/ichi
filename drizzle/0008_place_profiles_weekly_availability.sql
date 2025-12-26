ALTER TABLE "place_profiles"
DROP COLUMN "availability_start_minutes",
DROP COLUMN "availability_end_minutes",
ADD COLUMN "availability_weekly" jsonb;


