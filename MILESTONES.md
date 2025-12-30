# ichi — MILESTONES.md

**Purpose**
This document defines the high-level milestones for the current ichi iteration. Each milestone is intentionally **broad but coherent** (no nested numbering like `M0a.1.2`). Implementation happens in iterative “runs,” each producing a timestamped delivery note.

---

## Delivery Notes Convention

Every time we complete meaningful work toward a milestone (usually after a Cursor implementation run), we add a delivery note in:

`/docs/<MilestoneId>-<YYYYMMDD-HHMM>.md`

Example:
`/docs/M1-20251222-1540.md`

**Delivery note content (short, consistent):**

1. **Goal of this run**
2. **What was implemented**
3. **Key files touched**
4. **Behavioral notes / UX decisions**
5. **Schema changes (if any)**
6. **Known issues / follow-ups**
7. **What’s next**

---

## Milestone Definitions

### M1 — Foundations Locked (DB + App Skeleton + i18n scaffolding)

**Intent**
Establish stable foundations so feature work doesn’t churn core architecture.

**Scope**

* Supabase connection wired (env)
* Drizzle configured (schema location, migrations pipeline)
* i18n scaffolding in place (JSON locales + helper)
* Project structure baseline (`src/db`, `src/lib`, etc.)
* Minimal “place route” skeleton (no real UI features yet)

**Definition of Done**

* Drizzle can generate and run migrations against Supabase
* App boots locally with no placeholder errors
* Locale keys can be resolved (even if minimal)
* Repo has a clear structure for DB + app code

**Explicitly Not Included**

* Actual product features (check-in, anchoring, gallery)
* RLS policies (can start later if needed)
* Tests

---

### M2 — Place Read Path (Gallery + Card Viewing)

**Intent**
Make the place page real: scanning/visiting a portal shows an actual gallery.

**Scope**

* Place/portal resolution: portal → place
* Place page renders:

  * place header
  * gallery list (checked-in users, optionally anchored users)
* Card expanded view (read-only) includes:

  * place context
  * arrival time / remaining time
  * minimal info surfacing rules

**Definition of Done**

* Visiting a portal route shows a functioning gallery from DB-backed data
* Expanded card view is usable and respects visibility rules
* “My card ordering rules” implemented at least for the core cases:

  * just checked in
  * incomplete profile

**Explicitly Not Included**

* Editing profile fields
* Check-in creation flow
* Anchoring & pinging
* Reporting/blocking (can be M4)

---

### M3 — Check-In Write Path (Flow + Duration Picker + Alias Confirmation)

**Intent**
A new user can scan a portal and check in immediately (lowest-friction onboarding).

**Scope**

* Check-in flow:

  * duration selection (wheel picker library)
  * mood selection (ephemeral intent)
  * recognizability hint (ephemeral free text)
  * alias confirmation / re-generate step (3.5)
* Check-in persistence:

  * creates/updates place profile as needed
  * creates check-in record with expiry
* Post-check-in state:

  * “Checked in” button state
  * just-checked-in card shown at top temporarily
  * incomplete profile messaging shown on own card

**Definition of Done**

* Brand-new user can check in end-to-end
* Check-in appears in gallery (self + others)
* Expiry is represented (server-derived remaining time)
* No hard requirement to complete profile before check-in

**Explicitly Not Included**

* Anchoring
* Pings
* Full profile editor (can be M4)
* Advanced edge-case handling (e.g. offline caching)

---

## M4 — Expanded Profile (Editable)

### M4a — Profile Data & CRUD Plumbing (Business Logic First)

**Intent**  
Make the expanded profile card functional and stateful.  
Primary goal: validate correctness of persistence, reflection, and reload behavior — not visual fidelity.

**Scope**
- Expanded profile surface opens from “your card”
- Editable fields (auto-save, debounced):
  - Alias (place-profile scoped)
  - Mood (active check-in scoped)
  - Recognizability hint (active check-in scoped)
  - Hooks (active check-in scoped; seeded from last known state)
  - Age band (persistent)
  - Height (persistent)
- Auto-save with debounce and passive feedback (“Saving… / Saved / Error”)
- Changes must:
  - Persist after closing/reopening the profile
  - Reflect immediately in the place gallery where relevant (e.g. alias)
  - Survive page refresh

**Non-goals**
- UI polish or mockup fidelity
- Animations or transitions
- Anchoring logic expansion
- Pings or notifications

**Definition of Done**
- All fields round-trip correctly via DB
- No manual Save buttons required
- Expanded profile can be used end-to-end to update state

---

### M4b — Expanded Profile UI Fidelity

**Intent**  
Bring the expanded profile card in line with the designed mockups using shadcn-friendly primitives.

**Scope**
- Layout, spacing, hierarchy, typography
- Clear separation of ephemeral vs persistent sections
- Refined affordances (e.g. Back vs X, input sizing)
- Saved-state indicator polish

**Hard Constraints**
- No schema changes
- No new APIs
- No behavioral changes

**Definition of Done**
- Expanded profile visually matches approved mockups
- Interaction remains identical to M4a

---

### M5 — Safety & Moderation (Block / Report / Ban)

**Intent**
Make the system safe enough to deploy in real places.

**Scope**

* Block user (visibility removal)
* Report user (basic reporting pipeline)
* Ban user (admin capability)
* Portal disable (admin capability) for vandalized/removed stickers

**Definition of Done**

* Blocked users cannot see each other in place contexts
* Reports are persisted and reviewable by admin
* Banned users cannot participate
* Disabled portals do not function (graceful UX)

**Explicitly Not Included**

* Fine-grained preference controls
* Sophisticated abuse detection
* Appeals / workflows

---

### M6 — Anchoring + Availability + Pings (Rate-Limited)

**Intent**
Enable latent reachability: anchored users can be pinged when a place is empty.

**Scope**

* Anchoring boolean per place-profile
* Availability windows per place-profile
* Ping trigger:

  * when a user checks into a place with no active check-ins
  * and eligible anchored users are available
* Rate limits (hard MVP constraints):

  * send: max 1 ping/day/place
  * receive: max 3 pings/week total
* Email-only, identity-minimizing content

**Definition of Done**

* Anchoring can be enabled and is reflected in place page visibility rules
* Ping emails are sent under correct conditions
* Rate limits are enforced reliably
* No response/muting UI exists (by design)

**Explicitly Not Included**

* Notification preferences UI
* Ping replies or confirmations
* Push notifications

---

Perfect. Below is a **drop-in, `MILESTONES.md`-friendly** version you can paste as-is.
I’ve kept it crisp, operational, and acceptance-driven — no aspirational fluff, no premature hardening.

---

## M7 — Admin Operations & Production Readiness

### M7a — Admin Operations & Observability (Pre-Launch)

**Goal:**
Enable operating ichi without touching the database, and gain basic visibility into real usage and failures.

#### Scope

**Admin: Place & Portal Management**

* View list of portals with status (enabled/disabled) and basic metadata
* Create new portals via admin UI
* Create new places via admin UI
* Associate portals with places
* Enable / disable portals from admin UI
* View portal → place relationship in admin

**Admin: Seed / Creation Tooling**

* Manual creation flows only (no bulk import, no CLI)
* Explicit forms with validation for:

  * Place creation
  * Portal creation
* No geofencing, maps, or advanced location logic

**Admin: Basic Analytics / Logging**

* Record events for:

  * Check-ins created
  * Pings sent
  * Errors (API + client)
* Store events in first-party storage (DB or log table)
* Admin UI provides:

  * Aggregate counts (total / last 24h)
  * Recent event timestamps
* No alerting, dashboards, or external services

#### Acceptance Criteria

* A new place and portal can be created entirely via the admin UI
* A portal can be enabled/disabled without code or DB access
* Admin can answer:

  * “Are people checking in?”
  * “Are pings being sent?”
  * “Are errors occurring?”
* Analytics are append-only and do not affect core user flows
* No production hardening assumptions baked in

---

### M7b — Production Hardening (Final Pre-Launch)

**Goal:**
Make the system safe, predictable, and debuggable in production.

#### Scope

**Environment Validation**

* Explicit validation of required environment variables at startup
* Clear error messages for missing / invalid configuration

**Error Boundaries**

* Application-level error boundaries for:

  * Core user flows
  * Admin routes
* Graceful fallback UI for unexpected failures

**Performance Hygiene**

* Remove obvious render / fetch inefficiencies
* Avoid unnecessary recomputation in hot paths
* Ensure no debug logging runs in production builds

#### Acceptance Criteria

* App fails fast and clearly on invalid environment configuration
* User-facing errors do not crash the entire app
* Admin UI remains usable under partial failures
* No known performance foot-guns remain in core flows
* System is ready for first public deployment

---

### M8 — Card Taxonomy & Visual System

**Intent**  
Make profile cards semantically legible at a glance.  
Users should immediately understand *who a card represents relative to them* and *why that person is visible in this place* — without relying on carousel position or interaction.

This milestone focuses on **meaning, hierarchy, and signaling**, not mechanics.

---

**Scope**

Define and implement a **canonical card state taxonomy** with clear visual differentiation:

#### Card States (Mutually Exclusive)

* **Self**
  * The viewer’s own place-profile
  * Always highest priority
  * Editable entry point

* **Active Check-In**
  * User currently checked in (or within active window)
  * Highest social salience

* **Anchored**
  * User anchored to the place but not currently checked in
  * Latent / discoverable presence

* **Stale Anchored**
  * Anchored user whose `lastSeenAt` exceeds freshness threshold
  * Still visible, but de-emphasized

---

**Visual Differentiation Rules**

Cards may differ **only** via:

* Badges / labels
* Emphasis (opacity / contrast)
* Accent tokens (outline, subtle highlight)
* Interaction affordances (primary vs secondary CTA emphasis)

> No layout changes, no resizing, no carousel logic.

---

**State-Level Visual Semantics (MVP)**

* **Self**
  * Badge: “You”
  * Emphasis: 100%
  * Accent: subtle persistent highlight
  * Primary interaction opens editable profile

* **Active Check-In**
  * Badge: “Here now” (or equivalent presence indicator)
  * Emphasis: 100%
  * Accent: presence/success tone
  * Ping CTA clearly visible

* **Anchored**
  * Badge: “Anchored”
  * Emphasis: ~85–90%
  * Neutral accent
  * Ping CTA secondary but available

* **Stale Anchored**
  * Badge: “Seen before” / “Was here”
  * Emphasis: ~60–70%
  * No accent
  * Ping CTA visually deemphasized (not removed)

TTL logic for “stale” uses existing heuristics; no new rules introduced.

---

**Empty-State Card**

When no non-self cards exist:

* Render a dedicated empty-state card
* Messaging should be reassuring, not lonely
  * e.g. “No one else is around right now.”
* Purpose:
  * Prevent “broken app” perception
  * Normalize emptiness as a valid state

No hard CTAs required.

---

**Definition of Done**

* All profile cards render one of the four canonical states
* Each state is visually distinguishable without relying on position
* Self card is always clearly identifiable and editable
* Empty-state card renders correctly when applicable
* No behavioral changes introduced
* No schema changes required

---

**Explicitly Not Included**

* Carousel snapping, gutters, or geometry fixes
* Sorting or promotion logic changes
* New backend fields or APIs
* Animation polish beyond existing tokens
* Other users’ expanded profile fixes (separate task)

---

## Notes / Principles

* Milestones are **coherent** and **shipping-oriented**.
* Terminology (e.g. mood vs openness vs hooks taxonomy) may evolve; the PRD explicitly allows flexibility.
* Tests are explicitly out-of-scope for MVP.
* Cursor will generate implementation runs; each run must be captured via the delivery note convention above.

---

## Pre-MVP Backlog

### Misc

* [x] Fix the god-damn right-padding issue in the profile gallery

* [ ] Fix "Alias + mood" profile card sentence

* [ ] Fix "Last Seen" time formatting on profile card

* [ ] Remove Alias-regeneration when checking in AGAIN after having had a successful check-in before (over-writes existing alias for now reason)

* [ ] Introduce "local" vs. "traveler"

* [ ] Show "lastHooks" from expired check-in for anchored users

* [ ] Ping 1-to-1

* [ ] _Confirm_ email before allowing pings (abuse potential)

### UI / Interaction Refinements

* [ ] Unify alias generation so first-time self-profile preview and first check-in produce the same persisted place-scoped alias (single source of truth per user/place).

* [ ] Replace numeric inputs for **Age band** and **Height** with iOS-style wheel pickers

  * Reuse existing wheel picker infra if possible
  * Validate mobile ergonomics (thumb reach, scroll friction)
* [ ] Revisit **global Save State bar** copy + color semantics

  * Final wording for: `Idle`, `Saving…`, `Saved`, `Error`
  * Confirm contrast/accessibility in bright outdoor conditions
* [ ] Micro-copy pass across profile questions

  * Especially Mood / Recognizability / Hooks headings
  * Ensure tone consistency (conversational, non-instructional)

### Hooks System (Conceptual, Not Structural)

* [ ] Re-evaluate **Hooks taxonomy** based on early usage

  * Are categories meaningful or ignored?
  * Are some hooks never selected?
* [ ] Decide whether to split Hooks into clearer “jobs”:

  * *Vibe signal* (interest / energy / headspace)
  * *Invitation* (what I’m open to doing)
* [ ] Consider future variants:

  * City-scoped hooks
  * Venue-scoped hooks
  * Time-of-day or context-sensitive suggestions
* [ ] Validate max hooks limit (currently 10) against real behavior

### Profile & Navigation

* [ ] Decide whether expanded profile should ever get a **dedicated URL**

  * Current overlay/page hybrid is acceptable for MVP
* [ ] Enable opening **own profile by tapping own gallery card**

  * Non-critical, but improves mental model consistency
* [ ] Revisit alias regeneration affordance

  * Confirm placement, frequency expectations, and feedback timing

### Internationalization / Dev Ergonomics

* [ ] Add explicit **language override query param** (e.g. `?lang=en`)

  * Dev-only or hidden feature is fine
  * Do not remove Accept-Language auto-detection
* [ ] Final check for German copy expansion edge cases

  * Long compound words
  * Button truncation on small screens

### Check-in Lifecycle (Later Decisions)

* [ ] Define final **Check-out semantics**

  * Manual vs automatic only
  * Visibility after checkout
* [ ] Decide if Anchoring is:

  * A separate action
  * A post-check-in modifier
  * Or a future feature entirely

---

### Explicitly Not In Scope (for now)

* Auth / account system
* Cross-device persistence
* Profile history or analytics
* Social graph / following
* Messaging

---

## Pre-Launch Security Audit (Required Before Public Deployment)

> Goal: ensure basic safety, access control, and data integrity before exposing ichi to real-world usage.
> Scope: internal audit only; no external pentest assumed.

---

### 1. Admin Access & Privilege Boundaries

- [ ] All `/admin/*` routes are protected by server-side middleware  
- [ ] No admin pages render without a valid admin session cookie
- [ ] Admin authentication uses:
  - [ ] `ADMIN_TOKEN` from env
  - [ ] httpOnly cookie (no token in URL, no token in localStorage)
- [ ] Admin cookie is:
  - [ ] httpOnly
  - [ ] `secure` in production
  - [ ] reasonable `sameSite` setting
- [ ] Admin logout fully clears admin session cookie
- [ ] No admin data is accessible via unauthenticated API routes
- [ ] No server actions mutate admin-only state without admin auth checks

---

### 2. Privilege Escalation Checks

Verify that **non-admin users cannot**:

- [ ] Ban or unban users
- [ ] Modify `users.isBanned`, `bannedAt`, or `banReason`
- [ ] Change `user_reports.status`
- [ ] Enable or disable portals
- [ ] End or modify other users’ check-ins
- [ ] Access admin-only queries via client-side calls

> UI guards are not sufficient — server-side enforcement must exist.

---

### 3. Banned User Enforcement

- [ ] Banned users cannot create new check-ins
- [ ] Banned users cannot update existing check-ins
- [ ] Banned users cannot update place profiles or anchors
- [ ] Banned users do not appear in:
  - [ ] place galleries
  - [ ] active check-in lists
- [ ] Banned users receive a sane UX state (e.g. “Account disabled”), not a crash or silent failure

---

### 4. Blocking & Visibility Guarantees

- [ ] User blocks are enforced **symmetrically** (A blocks B ⇒ neither sees the other)
- [ ] Blocked users never appear in:
  - [ ] place galleries
  - [ ] expanded profile overlays
- [ ] Blocking applies across all places (not place-scoped)
- [ ] Blocking persists across:
  - [ ] later check-ins
  - [ ] page reloads
- [ ] Reporting does not implicitly block (and vice versa)

---

### 5. Portal Safety

- [ ] Disabled portals (`portals.isEnabled = false`) cannot resolve to places
- [ ] Portal routes fail gracefully when disabled (inactive screen, not error dump)
- [ ] No place data is leaked via disabled portal routes
- [ ] Admin can re-enable portals cleanly without side effects

---

### 6. Data Exposure & Leakage

- [ ] Admin-only queries are not reused in public pages
- [ ] Server-side props do not serialize admin-only fields
- [ ] No sensitive fields are sent to the client unnecessarily
- [ ] Report free-text is only visible in admin views

---

### 7. Identity & Session Assumptions

- [ ] Anonymous / pre-check-in users can block and report safely
- [ ] Clearing cookies creates a new identity (accepted behavior)
- [ ] `users.lastSeenAt` updates correctly on:
  - [ ] place visits
  - [ ] check-in create/update
  - [ ] block/unblock
  - [ ] report
- [ ] Identity behavior is documented as “anonymous by default” for MVP

---

### 8. Operational Safety (Nice-to-Have but Recommended)

- [ ] Admin actions are reversible (unban, re-enable portal)
- [ ] Check-ins can be force-ended via admin UI
- [ ] No destructive admin actions without explicit intent (no silent deletes)

---

### 9. Manual Smoke Tests (Do These)

- [ ] Visit `/admin` without token → access denied
- [ ] Log in as admin → all admin sections accessible
- [ ] Log out → admin access fully revoked
- [ ] Ban a user → verify read + write enforcement
- [ ] Disable a portal → verify inactive portal UX
- [ ] Block a user → verify mutual invisibility immediately
- [ ] Report a user → verify persistence + admin visibility

---

### Audit Result

- [ ] All checks passed  
- [ ] Known issues documented (blocking launch / non-blocking)  
- [ ] Ready for limited public deployment
