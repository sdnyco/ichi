CREATE TABLE "error_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "source" text NOT NULL,
  "route" text,
  "message" text NOT NULL,
  "detail" jsonb
);

CREATE INDEX "error_events_created_idx" ON "error_events" ("created_at" DESC);

