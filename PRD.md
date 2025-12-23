😄 Fair enough — you’re optimizing for *shipping*, not for moral virtue. I’ll take the keyboard.

Below is a **clean, production-oriented PRD** you can copy-paste directly into `PRD.md`.
It is intentionally **concise but complete**, biased toward *decisions*, *constraints*, and *non-goals*, not prose.

I’ve written it the way a good future-you (or Cursor) would want to read it when making implementation calls.

---

# ichi — Product Requirements Document (PRD)

**Status:** Draft (v0.1)
**Last updated:** 2025-MM-DD
**Owner:** Sidney
**Goal:** Ship a coherent, safe, low-friction v1 into real places

---

## 1. Product Intent

ichi is a **situational presence layer for real-world places**.

It enables people who are physically co-located to:

* signal presence
* express lightweight social intent
* recognize each other in real life

…without turning interaction into a platform-first or identity-heavy experience.

**Core principle:**

> Reduce friction for real-world interaction without replacing it.

ichi is not a chat app, not a social network, and not a dating platform.

---

## 2. Core Concepts & Ontology

### 2.1 User (global)

* A user has **one global account**
* Contains minimal, non-identifying data
* Owns multiple place profiles
* Can be anchored to multiple places
* Can be checked into **only one place at a time**

Future global toggles may live here (e.g. pause all availability).

---

### 2.2 Place

* A real-world location (e.g. bar, café)
* May have one or more **portals** (QR stickers)
* Portals are **ingress only**
* Social presence is always **place-scoped**, not portal-scoped

---

### 2.3 Place Profile (user × place)

A persistent, place-specific persona.

Contains:

* Alias (auto-generated, user-editable)
* Availability (weekly windows)
* Anchor state (boolean)
* Persistent recognizability traits (e.g. age band, height)
* History of check-ins (implicit)

Place profiles persist across visits.

---

### 2.4 Check-In (ephemeral)

A check-in is a **temporary state**:

> “I am here for the next X minutes.”

Properties:

* Place-scoped
* Time-bound
* Expires automatically
* At most **one active check-in per user globally**

Check-ins hold **ephemeral data only**:

* Mood / situational openness
* Hooks (situational intent)
* Ephemeral recognizability hints (e.g. clothing)

When a check-in expires, all its ephemeral data disappears.

---

## 3. Anchoring

Anchoring expresses **ongoing availability** without active presence.

* A user may anchor to multiple places
* Anchoring does **not** imply presence
* Anchoring is gated by availability windows
* Anchoring is boolean (no states) in MVP

Anchoring is considered an **emergent affordance**, not a forced primary action.

---

## 4. UX Primitives

### 4.1 Place Page

Displays:

* Place name & address
* Anchoring state (if relevant)
* Gallery of visible profiles:

  * Checked-in users
  * Anchored users (when applicable)

---

### 4.2 Profile Cards

#### Collapsed (Gallery)

Shows:

* Alias
* Mood (if checked in)
* Minimal recognizability hints
* Visual distinction for:

  * “This is you”
  * Incomplete profiles

#### Expanded (Modal / Overlay)

Always retains **place context**.

For **my card**:

* Place name
* Check-in status & remaining time
* Actions:

  * Check out
  * Anchor (future)
  * Edit profile

For **others’ cards**:

* Arrival time
* Time remaining
* Expanded situational info (still minimal)

---

### 4.3 Profile Editing

There is **no dedicated profile editor page**.

* The expanded profile card *is* the editor
* Explicit “Edit” toggle switches between view/edit modes
* Clear separation between:

  * Check-In Info (ephemeral)
  * General Info (persistent)

---

## 5. Check-In Flow

### Steps

1. **Duration**

   * e.g. 30 min, 1 hr, 2 hrs

2. **Mood**

   * Situational openness / intent
   * Ephemeral

3. **Recognizability Hint**

   * Free-text input
   * Ephemeral
   * Optional

4. **Alias Confirmation (Step 3.5)**

   * Auto-generated alias shown
   * User can re-generate or confirm
   * Clarifies how they will appear to others

### Key Rule

A user may **check in immediately**, even with:

* no hooks
* no persistent profile data

Profile completion is encouraged, never required.

---

## 6. Gallery Ordering Rules

A user’s own card appears at the top **only if**:

1. The profile is incomplete **and** the user is checked in
2. The user has *just* checked in (temporary)
3. The user is the only visible person at the place

Otherwise:

* Cards are ordered to prioritize **other users**
* On refresh or later return, the user’s card flows naturally

---

## 7. Hooks

* Hooks are **ephemeral**
* Stored on the **check-in**, not the place profile
* Express situational intent (e.g. “up for a chat”, “quiet company”)

Hooks do **not** automatically transfer between places.

When checking into a new place:

* Hooks may be *seeded* from recent usage
* But edits never propagate automatically

---

## 8. Safety & Moderation (MVP)

### Must-haves

* Block user
* Report user
* Ban user (admin)

Blocking semantics (symmetric vs asymmetric) are **deferred** and treated as implementation detail.

### Design constraints

* No profile photos
* No exact ages (age bands only)
* No exact timestamps exposed
* No identity leakage in notifications

---

## 9. Anchoring & Pinging (MVP)

If:

* A user checks into a place
* There are **no active check-ins**
* There are **anchored users available**

Then:

* A simple email ping is sent to eligible anchored users

### Rate limits (hard constraints)

* **Send:** max 1 ping / day / place
* **Receive:** max 3 pings / week total
* No responses, no muting UI, no preferences in MVP

---

## 10. Internationalization (i18n / l10n)

MVP launches with:

* **English (US)**
* **German (DE)**

Requirements:

* All user-facing strings behind translation keys
* JSON-based locale files
* Parameterized strings
* No hard-coded text in components

No language switcher UI required in MVP.

---

## 11. Non-Goals (Explicit)

* No chat or messaging
* No likes, matches, follows
* No social graph
* No testing (unit / e2e) in MVP
* No advanced notification preferences
* No profile photos

---

## 12. Milestones (High-Level)

* **M0:** Foundations

  * Ontology locked
  * Schema designed
  * i18n scaffolding

* **M1:** Presence MVP

  * Check-ins
  * Gallery
  * Profile cards
  * Blocking/reporting

* **M2:** Anchoring & Pings

  * Anchors
  * Availability
  * Email pings with rate limits

* **M3:** UX Hardening

  * Polishing flows
  * Edge cases
  * Copy refinement

---

## 13. Open / Deferred Questions

* Exact blocking semantics
* Visibility of persistent recognizability traits for anchored users
* Anchor decay or de-prioritization over time

These are intentionally deferred until real usage data exists.

---

**End of document**
