[45 tools called]

## Admin Inventory

- **Auth shell** – `src/app/admin/(panel)/layout.tsx` gates every panel page via `validateAdminCookie` from `src/lib/admin-auth.ts`, with entry at `src/app/admin/(panel)/page.tsx` and token flow in `src/app/admin/login/page.tsx`, `src/app/admin/login/action/route.ts`, and `src/app/admin/logout/route.ts`.
- **Reports view** – `src/app/admin/(panel)/reports/page.tsx` lists reports with status/reason filters, renders per-report details, provides status update form + quick actions for banning/unbanning a user and toggling a linked portal. Submits to `src/app/admin/(panel)/reports/actions/route.ts`, which calls `updateReportStatus` in `src/db/queries/adminReports.ts`.
- **Users view** – `src/app/admin/(panel)/users/page.tsx` searches by user ID, shows profile timestamps, ban state, recent linked reports (`listReportsForUser`), and most recent signups (`listRecentUsers`). Ban/unban form posts to `src/app/admin/(panel)/users/actions/route.ts`, which invokes `setUserBanState` from `src/db/queries/adminUsers.ts` (also expiring open check-ins via `expireActiveCheckinsForUser`).
- **Portals view** – `src/app/admin/(panel)/portals/page.tsx` lets admins search by code prefix and toggle `isEnabled`. The POST goes to `src/app/admin/(panel)/portals/actions/route.ts`, backed by `setPortalEnabled` + `searchPortals` in `src/db/queries/adminPortals.ts`. No creation/edit UI exists.
- **Check-ins view** – `src/app/admin/(panel)/check-ins/page.tsx` lists active/expired sessions via `listCheckins` from `src/db/queries/adminCheckins.ts`; “End now” submits to `src/app/admin/(panel)/check-ins/actions/route.ts`, which calls `endCheckinNow`.

## Data Model & Write Paths Relevant to M7a

- **Places** – Defined in `src/db/schema.ts` (`places` table: `id`, `slug`, `name`, `addressText`, timestamps). Read helpers in `src/db/queries/places.ts` (e.g., `getPlaceBySlug`, gallery buckets). There is **no** creation/edit/disable path in code; rows are presumably seeded manually. `placeProfiles` join table stores per-user aliases (`src/db/queries/checkins.ts` ensures profiles exist and updates aliases).
- **Portals** – `portals` table (`id`, unique `code`, `placeId`, `isEnabled`, timestamps). Public flows read via `src/db/queries/portals.ts`. Admin writes are limited to `setPortalEnabled` (boolean toggle); there is no portal creation, reassignment, or metadata editing path.
- **Check-ins** – `check_ins` table captures session timings (`startedAt`, `expiresAt`, `durationMinutes`, `mood`, etc.). Writes happen in `src/app/api/check-ins/route.ts`, which validates payload, ensures user/profile, calls `createCheckin` (`src/db/queries/checkins.ts`), and updates `placeProfiles`. Admin endings use `endCheckinNow`, and banning a user auto-expires their sessions (`setUserBanState`).
- **Pings** – `ping_events` & `ping_recipients` tables hold send attempts and recipient rows (`src/db/schema.ts`). `src/app/api/pings/route.ts` performs the send transaction: eligibility (`getPingEligibleRecipients`), day-level send limits (`hasPingEventForDay`), recipient limits (`filterRecipientsByReceiveLimit`, `getReceiveLimitMax` in `src/lib/pings.ts`), and email send via `sendPingEmails`. Successful sends already persist counts suitable for analytics.
- **Errors/logging** – Today errors are only printed (e.g., `console.error` in `src/app/api/check-ins/route.ts`, `src/app/api/pings/route.ts`, `src/app/api/reports/route.ts`) and debug logs via `logPingAction`. There is no persistent error log table, no admin visibility, and no structured event emitter.

## Gap Analysis (M7a Scope Only)

- **Place management**
  - Missing: list/search view, detail page, create/edit form, ability to archive/disable a place, and an easy way to attach metadata (name, slug, address) without touching code. Schema lacks an `isActive` flag, so “disable place” currently means hand-disabling every associated portal.
  - Existing: read-only helpers in `src/db/queries/places.ts` and implicit usage when rendering public place pages.
- **Portal management**
  - Missing: creation pipeline (code generation, assignment to place), editing/rotation of codes, reassignment to a different place, bulk views grouped by place, labels/notes. Current UI only searches by code prefix and toggles `isEnabled`; there is no pagination or context.
  - Existing: enable/disable flows and code lookup via `src/app/admin/(panel)/portals/page.tsx` + `src/db/queries/adminPortals.ts`.
- **Seed/creation tooling**
  - Missing: any scripted or UI-based way to insert places/portals in bulk. Today the only options are Drizzle migrations or manual SQL, which violate “multiple places without code changes.”
  - Recommended minimum: reuse the admin panel pattern (React Server Components + server actions) for ad-hoc creation plus a tiny Node script (e.g., `scripts/seed-places.ts`) leveraging the same query helpers for initial bootstrap. This matches existing infra (no separate CLI tooling yet) and keeps risk low.
- **Basic analytics/logging**
  - Check-ins: data exists in `check_ins`, but there is no aggregation or admin surface showing counts/trends.
  - Pings: `ping_events` + `ping_recipients` capture successful sends, yet no view surfaces counts or day-level trends; there’s also no logging when sends fail before insert (rate-limit block).
  - Errors: nothing is persisted; we cannot tally error volume or drill into problem endpoints. Need a light `error_events` table plus helper to log from API routes.
  - Event availability: check-in and ping successes already land in the DB; we would add minimal instrumentation for error logging (e.g., wrapping failed API handlers).

## M7a Overlap Check

- **Already shipped in M5B**
  - Admin auth shell (`src/app/admin/(panel)/layout.tsx`) and login/logout routes.
  - Reports list/detail + status updates (`src/app/admin/(panel)/reports/*`).
  - Users list/detail + ban/unban + related reports (`src/app/admin/(panel)/users/*`).
  - Portals search + enable/disable toggles (`src/app/admin/(panel)/portals/*`).
  - Check-ins list with “End now” server action (`src/app/admin/(panel)/check-ins/*`).

- **Partially shipped, needs extension**
  - Portal management: toggling exists, but creation, grouping, and reassignment needed for full ops.
  - Check-in instrumentation: raw data exists, but no aggregated analytics/monitoring to satisfy M7a logging goals.

- **Missing**
  - Any admin surface for places (CRUD, disable/archive).
  - Any tooling (UI or script) to seed/create places + portals without SQL.
  - Basic analytics/logging surfaces and persistent error logging.

## M7a Implementation Plan (do not start yet)

- **M7a.1 – Admin place directory**
  - Changes: add `src/db/queries/adminPlaces.ts` for list/detail lookups (joins on `places`, counts of portals/check-ins), new route `src/app/admin/(panel)/places/page.tsx`, and nav link.
  - Files: `src/app/admin/(panel)/layout.tsx`, new `.../places/*`, new query file.
  - Acceptance: Admin can visit `/admin/places`, see all places with slug/address and portal counts pulled from live data.

- **M7a.2 – Place create/edit/disable server actions**
  - Changes: implement server action endpoint (e.g., `src/app/admin/(panel)/places/actions/route.ts`) handling create/update/toggle-active flows, leveraging Drizzle insert/update; optionally expose `isActive` flag.
  - Files: new actions route, `src/db/queries/adminPlaces.ts` helpers for mutations.
  - Acceptance: Using the admin form, create a new place (name/slug/address), edit it, disable it; verifying via list view and public place lookup.

- **M7a.3 – Portal creation + reassignment tooling**
  - Changes: extend `src/app/admin/(panel)/portals/page.tsx` with grouped listing (optionally by place), add creation form (choose place, code, optional note), ability to reassign/rotate code; add server action updates in `src/app/admin/(panel)/portals/actions/route.ts` and new query helpers for insert/update.
  - Files: portal page/action, `src/db/queries/adminPortals.ts`.
  - Acceptance: Create a portal tied to a place, verify it appears in both portal and place views, toggle enable/disable still works, and reassignment updates downstream queries.

- **M7a.4 – Seed/creation script for bootstrap**
  - Changes: add `scripts/seed-places.ts` (or similar) that reads a JSON/YAML payload and inserts/updates places + portals using shared query helpers; wire npm script (`"seed:places": "tsx scripts/seed-places.ts ./data/places.json"`).
  - Files: `scripts/seed-places.ts`, `package.json`, sample data file under `docs/` or `data/`.
  - Acceptance: Run the script locally with sample input; confirm new rows appear and the admin UI lists them without manual SQL.

- **M7a.5 – Analytics dashboard**
  - Changes: author `src/db/queries/adminMetrics.ts` providing aggregated check-in counts (total + per-day via `date_trunc`) and ping send counts (using `ping_events.dayKey`), then surface them in a new `/admin/metrics` route with simple cards + optional sparkline (server components only).
  - Files: new query file, new route/components, update nav.
  - Acceptance: Load `/admin/metrics` and verify counts update after creating a check-in/ping in dev; time-bucketed data matches SQL spot-check.

- **M7a.6 – Error logging + viewer**
  - Changes: introduce lightweight `error_events` table + `src/lib/error-logger.ts` helper; wrap API routes (`/api/check-ins`, `/api/pings`, `/api/reports`, etc.) to call the logger on caught exceptions. Build `/admin/errors` view to list recent events with filters.
  - Files: new migration + schema update, shared logger helper, updates to relevant API routes, new admin page/query.
  - Acceptance: Force an error (e.g., missing env) and confirm it appears in `/admin/errors`, with metadata like endpoint + payload snippet.

## Proposed Schema Changes

1. **`places.is_active` boolean (default true)** – enables soft-disable/archiving without deleting portals. Migration: add column with default true; update `src/db/schema.ts`; ensure public queries filter on `isActive`.
2. **`error_events` table** – columns: `id` (uuid pk), `source` (text, e.g., `api/pings`), `severity` (text, default `error`), `message` (text), `payload` (jsonb, nullable), `created_at` (timestamptz default now). Migration plus additions to `src/db/schema.ts` and a simple insert helper.

No other schema modifications appear necessary for M7a.

Let me know if you’d like mock data formats or wireframes before implementation.