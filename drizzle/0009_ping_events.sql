ALTER TABLE "place_profiles" ADD COLUMN "contact_email" text;

CREATE TABLE "ping_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "place_id" uuid NOT NULL REFERENCES "places"("id"),
  "sender_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "sender_check_in_id" uuid NOT NULL REFERENCES "check_ins"("id"),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "day_key" text NOT NULL,
  "max_recipients" integer NOT NULL,
  "status" text NOT NULL DEFAULT 'sent'
);

CREATE TABLE "ping_recipients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "ping_event_id" uuid NOT NULL REFERENCES "ping_events"("id"),
  "recipient_user_id" uuid NOT NULL REFERENCES "users"("id"),
  "recipient_email" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX "ping_events_place_day_unique"
  ON "ping_events" ("place_id", "day_key");
CREATE INDEX "ping_events_place_idx" ON "ping_events" ("place_id");
CREATE INDEX "ping_events_sender_idx" ON "ping_events" ("sender_user_id");

CREATE UNIQUE INDEX "ping_recipients_event_recipient_unique"
  ON "ping_recipients" ("ping_event_id", "recipient_user_id");
CREATE INDEX "ping_recipients_recipient_idx"
  ON "ping_recipients" ("recipient_user_id", "created_at");

