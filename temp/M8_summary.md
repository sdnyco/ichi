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