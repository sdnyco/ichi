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

### M7 — Deployability & Place Ops

**Intent**
Make it operationally deployable across multiple real places.

**Scope**

* Place + portal management flow (admin)
* Seed/creation tooling for places and portals
* Basic analytics/logging for:

  * check-ins created
  * pings sent
  * errors
* Production hardening:

  * env validation
  * error boundaries
  * basic performance hygiene

**Definition of Done**

* Multiple places can be configured and used without code changes
* Portals can be activated/disabled safely
* App is deployable and stable enough for live pilot use

**Explicitly Not Included**

* Full analytics suite
* A/B testing
* Deep metrics dashboards

---

## Notes / Principles

* Milestones are **coherent** and **shipping-oriented**.
* Terminology (e.g. mood vs openness vs hooks taxonomy) may evolve; the PRD explicitly allows flexibility.
* Tests are explicitly out-of-scope for MVP.
* Cursor will generate implementation runs; each run must be captured via the delivery note convention above.

---